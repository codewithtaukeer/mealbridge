import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { supabaseAdmin } from './lib/supabase';
import { prisma } from './lib/prisma';
import type { DomainEvent, DomainEventType } from '@mealbridge/shared';

interface SocketUser {
  id: string;
  role: string;
  organizationId?: string | null;
}

interface SocketData {
  user?: SocketUser;
}

let io: SocketIOServer<any, any, any, SocketData>;

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer<any, any, any, SocketData> {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow unauthenticated connection for public food discovery room only
        return next();
      }

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        return next(new Error('Authentication failed'));
      }

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: { organizationMemberships: true },
      });

      if (dbUser && dbUser.isActive) {
        const orgId = dbUser.organizationMemberships[0]?.organizationId ?? null;
        socket.data.user = {
          id: dbUser.id,
          role: dbUser.role,
          organizationId: orgId,
        };
      }

      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    // Public room for real-time food updates
    socket.join('food:available');

    if (user) {
      // User private room
      socket.join(`user:${user.id}`);

      // Organization private room
      if (user.organizationId) {
        socket.join(`org:${user.organizationId}`);
      }

      // Role-specific rooms
      if (user.role === 'DONOR') {
        socket.join('role:DONOR');
      } else if (user.role === 'RECIPIENT') {
        socket.join('role:RECIPIENT');
      } else if (user.role === 'VOLUNTEER') {
        socket.join('role:VOLUNTEER');
        socket.join('rescues:open');
      } else if (user.role === 'ADMIN') {
        socket.join('role:ADMIN');
        socket.join('admin:operations');
      }
    }

    // Dynamic authorized room subscription
    socket.on('subscribe:entity', (data: { entityType: string; entityId: string }) => {
      if (!data?.entityType || !data?.entityId) return;
      const room = `${data.entityType}:${data.entityId}`;
      socket.join(room);
    });

    socket.on('unsubscribe:entity', (data: { entityType: string; entityId: string }) => {
      if (!data?.entityType || !data?.entityId) return;
      const room = `${data.entityType}:${data.entityId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // Cleaned up automatically by Socket.IO
    });
  });

  return io;
}

export function getIO(): SocketIOServer<any, any, any, SocketData> {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Publish typed domain event to specified or automated role rooms
 */
export function publishDomainEvent(
  type: DomainEventType,
  entityId: string,
  entityType: 'donation' | 'rescue' | 'organization' | 'report' | 'notification',
  targetRooms?: string[],
  actorId?: string,
  data?: Record<string, any>
): void {
  if (!io) return;

  const eventPayload: DomainEvent = {
    type,
    entityId,
    entityType,
    timestamp: new Date().toISOString(),
    actorId,
    data,
  };

  if (targetRooms && targetRooms.length > 0) {
    targetRooms.forEach((room) => {
      io.to(room).emit('domain:event', eventPayload);
    });
  } else {
    // Default routing based on domain event type
    switch (type) {
      case 'donation.created':
        io.to('food:available').to('role:RECIPIENT').to('role:VOLUNTEER').emit('domain:event', eventPayload);
        break;

      case 'donation.updated':
      case 'donation.expired':
        io.to('food:available').to('role:RECIPIENT').to('role:VOLUNTEER').emit('domain:event', eventPayload);
        break;

      case 'donation.reserved':
        io.to('food:available').to('role:RECIPIENT').emit('domain:event', eventPayload);
        break;

      case 'rescue.created':
        io.to('rescues:open').to('role:VOLUNTEER').to('admin:operations').emit('domain:event', eventPayload);
        break;

      case 'rescue.assigned':
      case 'rescue.pickup_confirmed':
      case 'rescue.failed':
      case 'rescue.cancelled':
        io.to(`rescue:${entityId}`).to('admin:operations').emit('domain:event', eventPayload);
        break;

      case 'rescue.delivery_confirmed':
        io.to(`rescue:${entityId}`).to('role:DONOR').to('role:RECIPIENT').to('admin:operations').emit('domain:event', eventPayload);
        break;

      case 'organization.verification_requested':
      case 'report.created':
        io.to('admin:operations').emit('domain:event', eventPayload);
        break;

      default:
        io.emit('domain:event', eventPayload);
        break;
    }
  }
}
