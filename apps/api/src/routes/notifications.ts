import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export const notificationRouter = Router();

// In-memory store for notifications (for admin & users)
export interface MockNotification {
  id: string;
  userId?: string;
  roleTarget?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'notif-admin-seed-1',
    roleTarget: 'ADMIN',
    type: 'ORG_VERIFICATION_REQUESTED',
    title: 'New Verification Request: Grand Heritage Hotel',
    message: 'Grand Heritage Hotel & Banquet submitted FSSAI documentation for verification review.',
    link: '/admin/verification',
    resourceType: 'organization',
    resourceId: 'org-seed-pending-1',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-admin-seed-2',
    roleTarget: 'ADMIN',
    type: 'ORG_VERIFICATION_REQUESTED',
    title: 'New Verification Request: Annapurna Kitchen',
    message: 'Annapurna Community Kitchen submitted NGO Darpan certification for review.',
    link: '/admin/verification',
    resourceType: 'organization',
    resourceId: 'org-seed-pending-2',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function addNotification(notif: Omit<MockNotification, 'id' | 'createdAt' | 'isRead'>) {
  const newNotif: MockNotification = {
    ...notif,
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  mockNotifications.unshift(newNotif);
  return newNotif;
}

/**
 * GET /api/v1/notifications
 * Returns notifications for authenticated user or admin
 */
notificationRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let dbNotifications: any[] = [];
    try {
      dbNotifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (_dbErr) {
      // DB offline fallback
    }

    // Merge in-memory notifications
    let inMemory = mockNotifications.filter((n) => {
      if (user.role === 'ADMIN' && n.roleTarget === 'ADMIN') return true;
      if (n.userId && n.userId === user.id) return true;
      return false;
    });

    const combined = [...inMemory, ...dbNotifications];
    // Deduplicate by id
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ data: unique });
  } catch (_err) {
    res.status(200).json({ data: mockNotifications });
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
  } catch {}

  const mem = mockNotifications.find((n) => n.id === notifId);
  if (mem) mem.isRead = true;

  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
notificationRouter.post('/mark-all-read', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  } catch {}

  mockNotifications.forEach((n) => {
    if (user.role === 'ADMIN' && n.roleTarget === 'ADMIN') n.isRead = true;
    if (n.userId === user.id) n.isRead = true;
  });

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
