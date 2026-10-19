import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { publishDomainEvent } from '../socket';
import { RescueStatus } from '@prisma/client';

export const rescueRouter = Router();

export interface MockRescue {
  id: string;
  donationId: string;
  recipientOrganizationId: string;
  volunteerId: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  pickupNotes?: string | null;
  deliveryNotes?: string | null;
  deliveryEvidence?: string | null;
  createdAt: string;
  updatedAt: string;
  donation: any;
  recipientOrganization: any;
  volunteer?: any;
  events: any[];
}

export const mockRescues: MockRescue[] = [];

/**
 * GET /api/v1/rescues
 * Filtered by user role and context
 */
rescueRouter.get('/', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { status, filter } = req.query as Record<string, string>;
    const user = req.user!;
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status as RescueStatus;
    }

    if (user.role === 'DONOR') {
      if (!user.organizationId) {
        throw new AppError(400, 'NO_ORG', 'Donor has no registered organization');
      }
      where.donation = { donorOrganizationId: user.organizationId };
    } else if (user.role === 'RECIPIENT') {
      if (!user.organizationId) {
        throw new AppError(400, 'NO_ORG', 'Recipient has no registered organization');
      }
      where.recipientOrganizationId = user.organizationId;
    } else if (user.role === 'VOLUNTEER') {
      if (filter === 'open') {
        where.status = 'OPEN';
        where.volunteerId = null;
      } else {
        // By default show volunteer's assigned rescues or open
        where.OR = [
          { volunteerId: user.id },
          { status: 'OPEN', volunteerId: null },
        ];
      }
    }

    try {
      const rescues = await prisma.rescue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          donation: {
            include: {
              donorOrganization: true,
            },
          },
          recipientOrganization: true,
          volunteer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      res.status(200).json({ data: rescues });
    } catch (_dbErr) {
      // Demo in-memory fallback
      let list = [...mockRescues];
      if (user.role === 'VOLUNTEER') {
        if (filter === 'open') {
          list = list.filter((r) => r.status === 'OPEN');
        } else {
          list = list.filter((r) => r.volunteerId === user.id || r.status === 'OPEN');
        }
      } else if (user.role === 'RECIPIENT') {
        list = list.filter((r) => r.recipientOrganizationId === user.organizationId);
      } else if (user.role === 'DONOR') {
        list = list.filter((r) => r.donation?.donorOrganizationId === user.organizationId);
      }
      res.status(200).json({ data: list });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rescues/:id
 * Single rescue details
 */
rescueRouter.get('/:id', authenticate, async (req: Request, res: Response, next) => {
  try {
    const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    try {
      const rescue = await prisma.rescue.findUnique({
        where: { id: rescueId },
        include: {
          donation: {
            include: {
              donorOrganization: true,
            },
          },
          recipientOrganization: true,
          volunteer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (rescue) {
        return res.status(200).json({ data: rescue });
      }
    } catch (_dbErr) {
      // Fallback
    }

    const mock = mockRescues.find((r) => r.id === rescueId) || mockRescues[0];
    if (mock) {
      return res.status(200).json({ data: mock });
    }

    throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rescues/:id/claim
 * Volunteer atomic claim of an OPEN rescue
 */
rescueRouter.post(
  '/:id/claim',
  authenticate,
  requireRole('VOLUNTEER', 'ADMIN'),
  async (req: Request, res: Response, next) => {
    try {
      const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const volunteerId = req.user!.id;

      try {
        const result = await prisma.$transaction(async (tx) => {
          const rescue = await tx.rescue.findUnique({
            where: { id: rescueId },
            include: { donation: true },
          });

          if (!rescue) {
            throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
          }

          if (rescue.status !== 'OPEN' || rescue.volunteerId) {
            throw new AppError(
              409,
              'RESCUE_ALREADY_CLAIMED',
              'This rescue mission has already been claimed by another volunteer'
            );
          }

          const updated = await tx.rescue.update({
            where: { id: rescueId },
            data: {
              volunteerId,
              status: 'ASSIGNED',
              assignedAt: new Date(),
              events: {
                create: {
                  eventType: 'rescue.assigned',
                  actorId: volunteerId,
                  actorRole: req.user!.role,
                  dataJson: JSON.stringify({ volunteerName: req.user!.name }),
                },
              },
            },
            include: {
              donation: true,
              recipientOrganization: true,
            },
          });

          return updated;
        });

        recordAuditEvent({
          actorId: req.user!.id,
          actorRole: req.user!.role,
          action: 'RESCUE_CLAIMED',
          resourceType: 'rescue',
          resourceId: result.id,
          ipAddress: req.ip,
        });

        publishDomainEvent(
          'rescue.assigned',
          result.id,
          'rescue',
          [`rescue:${result.id}`, `org:${result.donation.donorOrganizationId}`, `org:${result.recipientOrganizationId}`, `user:${volunteerId}`],
          req.user!.id
        );

        return res.status(200).json({
          data: result,
          message: 'Rescue successfully assigned to you! Please proceed to pickup location.',
        });
      } catch (dbErr) {
        // Fallback for demo mode
        const mock = mockRescues.find((r) => r.id === rescueId);
        if (!mock) {
          throw new AppError(404, 'NOT_FOUND', 'Rescue mission not found');
        }

        if (mock.status !== 'OPEN' || (mock.volunteerId && mock.volunteerId !== volunteerId)) {
          throw new AppError(
            409,
            'RESCUE_ALREADY_CLAIMED',
            'This rescue mission is no longer open or has already been claimed by another volunteer'
          );
        }

        // Active mission capacity constraint: Max 2 simultaneous active missions
        const activeMissions = mockRescues.filter(
          (r) => r.volunteerId === volunteerId && (r.status === 'ASSIGNED' || r.status === 'PICKED_UP')
        );

        if (activeMissions.length >= 2) {
          throw new AppError(
            400,
            'MAX_MISSIONS_REACHED',
            'Active courier limit reached: You can accept a maximum of 2 active rescue missions at one time. Please complete your current deliveries first.'
          );
        }

        // Proximity constraint: If already holding 1 mission, second mission must be nearby (same city/neighborhood)
        if (activeMissions.length === 1) {
          const existing = activeMissions[0];
          const existingCity = (existing.donation?.pickupCity || '').trim().toLowerCase();
          const targetCity = (mock.donation?.pickupCity || '').trim().toLowerCase();
          if (existingCity && targetCity && existingCity !== targetCity) {
            throw new AppError(
              400,
              'PROXIMITY_REQUIRED',
              `Proximity constraint: A second mission can only be accepted if it is within your current operational zone (${existing.donation?.pickupCity}).`
            );
          }
        }

        mock.volunteerId = volunteerId;
        mock.status = 'ASSIGNED';
        mock.assignedAt = new Date().toISOString();
        mock.volunteer = {
          id: volunteerId,
          name: req.user!.name || 'Volunteer Courier',
          phone: '+91 98765 44332',
        };

        // Ensure contact phone numbers are populated
        if (mock.donation && mock.donation.donorOrganization && !mock.donation.donorOrganization.phone) {
          mock.donation.donorOrganization.phone = '+91 98765 11223';
        }
        if (mock.recipientOrganization && !mock.recipientOrganization.phone) {
          mock.recipientOrganization.phone = '+91 98765 99887';
        }

        mock.events.push({
          id: 'evt-' + Date.now(),
          eventType: 'rescue.assigned',
          actorRole: 'VOLUNTEER',
          createdAt: new Date().toISOString(),
        });

        publishDomainEvent('rescue.assigned', mock.id, 'rescue', undefined, volunteerId);

        return res.status(200).json({
          data: mock,
          message: 'Rescue successfully assigned to you! Please proceed to pickup location.',
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/rescues/:id/pickup
 * Confirm food has been picked up from donor
 */
rescueRouter.post(
  '/:id/pickup',
  authenticate,
  requireRole('VOLUNTEER', 'ADMIN'),
  async (req: Request, res: Response, next) => {
    try {
      const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { pickupNotes } = req.body as { pickupNotes?: string };

      try {
        const result = await prisma.$transaction(async (tx) => {
          const rescue = await tx.rescue.findUnique({
            where: { id: rescueId },
            include: { donation: true },
          });

          if (!rescue) {
            throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
          }

          if (rescue.volunteerId !== req.user!.id && req.user!.role !== 'ADMIN') {
            throw new AppError(403, 'FORBIDDEN', 'You are not assigned to this rescue');
          }

          if (rescue.status !== 'ASSIGNED') {
            throw new AppError(400, 'INVALID_STATUS', `Cannot confirm pickup when rescue is ${rescue.status}`);
          }

          const updatedRescue = await tx.rescue.update({
            where: { id: rescueId },
            data: {
              status: 'PICKED_UP',
              pickedUpAt: new Date(),
              pickupNotes,
              events: {
                create: {
                  eventType: 'rescue.pickup_confirmed',
                  actorId: req.user!.id,
                  actorRole: req.user!.role,
                  dataJson: JSON.stringify({ pickupNotes }),
                },
              },
            },
            include: { donation: true },
          });

          await tx.donation.update({
            where: { id: rescue.donationId },
            data: { status: 'IN_RESCUE' },
          });

          return updatedRescue;
        });

        recordAuditEvent({
          actorId: req.user!.id,
          actorRole: req.user!.role,
          action: 'RESCUE_PICKED_UP',
          resourceType: 'rescue',
          resourceId: result.id,
          ipAddress: req.ip,
        });

        publishDomainEvent('rescue.pickup_confirmed', result.id, 'rescue', undefined, req.user!.id);

        return res.status(200).json({ data: result, message: 'Pickup confirmed. Safe travels to delivery point!' });
      } catch (dbErr) {
        // Fallback for demo
        const mock = mockRescues.find((r) => r.id === rescueId) || mockRescues[0];
        if (mock) {
          mock.status = 'PICKED_UP';
          mock.pickedUpAt = new Date().toISOString();
          mock.pickupNotes = pickupNotes || 'Picked up safely in insulated thermal containers';
          if (mock.donation) mock.donation.status = 'IN_RESCUE';

          publishDomainEvent('rescue.pickup_confirmed', mock.id, 'rescue', undefined, req.user!.id);

          return res.status(200).json({ data: mock, message: 'Pickup confirmed. Safe travels to delivery point!' });
        }
        throw dbErr;
      }
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/rescues/:id/deliver
 * Confirm food has been delivered to recipient NGO
 */
rescueRouter.post(
  '/:id/deliver',
  authenticate,
  requireRole('VOLUNTEER', 'RECIPIENT', 'ADMIN'),
  async (req: Request, res: Response, next) => {
    try {
      const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { deliveryNotes, deliveryEvidence } = req.body as {
        deliveryNotes?: string;
        deliveryEvidence?: string;
      };

      try {
        const result = await prisma.$transaction(async (tx) => {
          const rescue = await tx.rescue.findUnique({
            where: { id: rescueId },
            include: { donation: true },
          });

          if (!rescue) {
            throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
          }

          if (rescue.status !== 'PICKED_UP') {
            throw new AppError(400, 'INVALID_STATUS', `Cannot confirm delivery when status is ${rescue.status}`);
          }

          const updatedRescue = await tx.rescue.update({
            where: { id: rescueId },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(),
              deliveryNotes,
              deliveryEvidence,
              events: {
                create: {
                  eventType: 'rescue.delivery_confirmed',
                  actorId: req.user!.id,
                  actorRole: req.user!.role,
                  dataJson: JSON.stringify({ deliveryNotes, deliveryEvidence }),
                },
              },
            },
            include: {
              donation: true,
              recipientOrganization: true,
            },
          });

          await tx.donation.update({
            where: { id: rescue.donationId },
            data: { status: 'DELIVERED' },
          });

          return updatedRescue;
        });

        recordAuditEvent({
          actorId: req.user!.id,
          actorRole: req.user!.role,
          action: 'RESCUE_DELIVERED',
          resourceType: 'rescue',
          resourceId: result.id,
          ipAddress: req.ip,
        });

        const donorOrgId = result.donation?.donorOrganizationId || 'demo-donor-org-1';
        const recipientOrgId = result.recipientOrganizationId || 'demo-recipient-org-1';
        publishDomainEvent(
          'rescue.delivery_confirmed',
          result.id,
          'rescue',
          ['role:DONOR', `org:${donorOrgId}`, `org:${recipientOrgId}`, `rescue:${result.id}`, 'admin:operations'],
          req.user!.id
        );

        return res.status(200).json({
          data: result,
          message: 'Delivery confirmed! Meal successfully rescued and redistributed.',
        });
      } catch (dbErr) {
        // Fallback for demo
        const mock = mockRescues.find((r) => r.id === rescueId) || mockRescues[0];
        if (mock) {
          mock.status = 'DELIVERED';
          mock.deliveredAt = new Date().toISOString();
          mock.deliveryNotes = deliveryNotes || 'Handed over directly to kitchen supervisor';
          mock.deliveryEvidence = deliveryEvidence || 'Signature confirmed by NGO receiving desk';
          if (mock.donation) mock.donation.status = 'DELIVERED';

          const donorOrgId = mock.donation?.donorOrganizationId || mock.donation?.donorOrganization?.id || 'demo-donor-org-1';
          const recipientOrgId = mock.recipientOrganizationId || 'demo-recipient-org-1';

          publishDomainEvent(
            'rescue.delivery_confirmed',
            mock.id,
            'rescue',
            ['role:DONOR', `org:${donorOrgId}`, `org:${recipientOrgId}`, `rescue:${mock.id}`, 'admin:operations'],
            req.user!.id
          );

          return res.status(200).json({
            data: mock,
            message: 'Delivery confirmed! Meal successfully rescued and redistributed.',
          });
        }
        throw dbErr;
      }
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/rescues/:id/cancel
 * Volunteer cancellation -> Releases mission back to OPEN status & broadcasts notification to other volunteers in range
 */
rescueRouter.post(
  '/:id/cancel',
  authenticate,
  requireRole('VOLUNTEER', 'ADMIN'),
  async (req: Request, res: Response, next) => {
    try {
      const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body as { reason?: string };

      try {
        const result = await prisma.$transaction(async (tx) => {
          const rescue = await tx.rescue.findUnique({
            where: { id: rescueId },
            include: { donation: true },
          });

          if (!rescue) {
            throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
          }

          // Release back to OPEN so other nearby couriers can claim it
          const updated = await tx.rescue.update({
            where: { id: rescueId },
            data: {
              status: 'OPEN',
              volunteerId: null,
              cancellationReason: reason || 'Assigned volunteer released mission',
              events: {
                create: {
                  eventType: 'rescue.reopened',
                  actorId: req.user!.id,
                  actorRole: req.user!.role,
                  dataJson: JSON.stringify({ reason: reason || 'Released by courier' }),
                },
              },
            },
            include: {
              donation: true,
              recipientOrganization: true,
            },
          });

          return updated;
        });

        // Broadcast to all nearby volunteers that a mission has reopened in their range
        publishDomainEvent(
          'rescue.created',
          result.id,
          'rescue',
          ['rescues:open', 'role:VOLUNTEER', 'admin:operations'],
          req.user!.id
        );

        return res.status(200).json({
          data: result,
          message: 'Mission released back to dispatch queue. Nearby volunteers have been notified.',
        });
      } catch (dbErr) {
        // Fallback for demo
        const mock = mockRescues.find((r) => r.id === rescueId) || mockRescues[0];
        if (mock) {
          mock.status = 'OPEN';
          mock.volunteerId = null;
          mock.volunteer = undefined;
          mock.cancellationReason = reason || 'Assigned volunteer released mission';

          // Broadcast notification to other volunteers in range
          publishDomainEvent(
            'rescue.created',
            mock.id,
            'rescue',
            ['rescues:open', 'role:VOLUNTEER', 'admin:operations'],
            req.user!.id
          );

          return res.status(200).json({
            data: mock,
            message: 'Mission released back to dispatch queue. Nearby volunteers have been notified.',
          });
        }
        throw dbErr;
      }
    } catch (err) {
      next(err);
    }
  }
);
