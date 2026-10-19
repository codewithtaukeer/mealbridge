import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
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
 * Helper to record notifications directly into PostgreSQL database
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
    console.error('Failed to create notification in DB:', err);
  }
}

/**
 * GET /api/v1/notifications
 * Returns real notifications from PostgreSQL for authenticated user
 */
notificationRouter.get('/', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ data: dbNotifications });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
notificationRouter.post('/:id/read', authenticate, async (req: Request, res: Response, next) => {
  try {
    const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
notificationRouter.post('/mark-all-read', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});
