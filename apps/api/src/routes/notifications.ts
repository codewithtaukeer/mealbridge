import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';

export const notificationRouter = Router();

export interface AddNotificationInput {
  userId?: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Helper to record notifications directly into PostgreSQL database or Supabase REST
 */
export async function addNotification(input: AddNotificationInput) {
  try {
    if (input.userId) {
      return await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          isRead: false,
        },
      });
    } else {
      // Broadcast to all admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: input.type,
            title: input.title,
            message: input.message,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            isRead: false,
          })),
        });
      }
    }
  } catch (err) {
    console.warn('Prisma notification creation failed, falling back to Supabase REST:', err);
    try {
      if (input.userId) {
        await supabaseAdmin.from('notifications').insert({
          id: randomUUID(),
          user_id: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } else {
        const { data: adminUsers } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'ADMIN');

        if (adminUsers && adminUsers.length > 0) {
          await supabaseAdmin.from('notifications').insert(
            adminUsers.map((a: any) => ({
              id: randomUUID(),
              user_id: a.id,
              type: input.type,
              title: input.title,
              message: input.message,
              resource_type: input.resourceType,
              resource_id: input.resourceId,
              is_read: false,
              created_at: new Date().toISOString(),
            }))
          );
        }
      }
    } catch (e: any) {
      console.error('Supabase notification fallback error:', e.message);
    }
  }
}

/**
 * GET /api/v1/notifications
 * Returns real notifications from PostgreSQL or Supabase for authenticated user
 */
notificationRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  try {
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ data: dbNotifications });
  } catch (err) {
    console.warn('Prisma notifications query failed, falling back to Supabase REST:', err);
    try {
      const { data: supaNotifs } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const formatted = (supaNotifs || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        resourceType: n.resource_type,
        resourceId: n.resource_id,
        isRead: n.is_read,
        readAt: n.read_at,
        createdAt: n.created_at,
      }));

      return res.status(200).json({ data: formatted });
    } catch {
      return res.status(200).json({ data: [] });
    }
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
notificationRouter.post('/:id/read', authenticate, async (req: Request, res: Response) => {
  const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch {
    try {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notifId);
    } catch {}
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  }
});

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
notificationRouter.post('/mark-all-read', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch {
    try {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch {}
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  }
});
