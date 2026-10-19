import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { publishDomainEvent } from '../socket';
import { RescueStatus } from '@prisma/client';

export const rescueRouter = Router();

/**
 * GET /api/v1/rescues
 * Filtered by user role and context from database
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

    if (!rescue) {
      throw new AppError(404, 'NOT_FOUND', 'Rescue not found');
    }

    return res.status(200).json({ data: rescue });
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

      // Active mission capacity constraint: Max 2 simultaneous active missions
      const activeCount = await prisma.rescue.count({
        where: {
          volunteerId,
          status: { in: ['ASSIGNED', 'PICKED_UP'] },
        },
      });

      if (activeCount >= 2) {
        throw new AppError(
          400,
          'MAX_MISSIONS_REACHED',
          'Active courier limit reached: You can accept a maximum of 2 active rescue missions at one time. Please complete your current deliveries first.'
        );
      }

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

      const donorOrgId = result.donation?.donorOrganizationId || 'org-donor';
      const recipientOrgId = result.recipientOrganizationId || 'org-recipient';
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
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/rescues/:id/cancel
 * Volunteer cancellation -> Releases mission back to OPEN status & broadcasts notification to other volunteers
 */
rescueRouter.post(
  '/:id/cancel',
  authenticate,
  requireRole('VOLUNTEER', 'ADMIN'),
  async (req: Request, res: Response, next) => {
    try {
      const rescueId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body as { reason?: string };

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
    } catch (err) {
      next(err);
    }
  }
);
