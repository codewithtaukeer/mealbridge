import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import type { DomainEvent } from '@mealbridge/shared';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToEntity: (entityType: string, entityId: string) => void;
  unsubscribeFromEntity: (entityType: string, entityId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  subscribeToEntity: () => {},
  unsubscribeFromEntity: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const activeSubscriptions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = session?.access_token;
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Resubscribe to active entity rooms upon reconnect
      activeSubscriptions.current.forEach((room) => {
        const [entityType, entityId] = room.split(':');
        if (entityType && entityId) {
          newSocket.emit('subscribe:entity', { entityType, entityId });
        }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Domain Event Listeners & Live Toast Alerts
    newSocket.on('domain:event', (event: DomainEvent) => {
      switch (event.type) {
        case 'donation.created':
          toast('🍲 New surplus food listing posted nearby', {
            icon: '🟢',
            style: {
              background: '#0e1a19',
              color: '#ffffff',
              border: '1px solid #3ddc91',
            },
          });
          break;
        case 'donation.reserved':
          toast.success('Food donation reserved by recipient organization!');
          break;
        case 'rescue.created':
          toast('🚴 New rescue mission ready for volunteer claim', {
            icon: '⚡',
            style: {
              background: '#0e1a19',
              color: '#ffffff',
              border: '1px solid #ffcd48',
            },
          });
          break;
        case 'rescue.delivery_confirmed':
          toast.success('Food received! Delivery confirmed & verified by recipient NGO desk. 🍱✅', {
            duration: 6000,
            icon: '🎉',
          });
          break;
        default:
          break;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session?.access_token]);

  const subscribeToEntity = useCallback((entityType: string, entityId: string) => {
    if (!entityType || !entityId) return;
    const roomKey = `${entityType}:${entityId}`;
    activeSubscriptions.current.add(roomKey);
    if (socket && isConnected) {
      socket.emit('subscribe:entity', { entityType, entityId });
    }
  }, [socket, isConnected]);

  const unsubscribeFromEntity = useCallback((entityType: string, entityId: string) => {
    if (!entityType || !entityId) return;
    const roomKey = `${entityType}:${entityId}`;
    activeSubscriptions.current.delete(roomKey);
    if (socket && isConnected) {
      socket.emit('unsubscribe:entity', { entityType, entityId });
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        subscribeToEntity,
        unsubscribeFromEntity,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
