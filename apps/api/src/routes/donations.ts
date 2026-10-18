import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireRole, requireOrganization } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { findMatchingRecipients } from '../services/matching';
import { publishDomainEvent } from '../socket';
import { FoodCategory, QuantityUnit, DonationStatus } from '@prisma/client';

export const donationRouter = Router();

const createDonationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.nativeEnum(FoodCategory),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.nativeEnum(QuantityUnit),
  imageUrl: z.string().url().optional(),
  preparedAt: z.string().datetime().optional(),
  pickupDeadline: z.string().datetime('A valid future pickup deadline ISO string is required'),
  pickupWindowStart: z.string().datetime().optional(),
  pickupWindowEnd: z.string().datetime().optional(),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  pickupCity: z.string().min(2, 'Pickup city is required'),
  pickupLatitude: z.number().optional(),
  pickupLongitude: z.number().optional(),
  pickupInstructions: z.string().optional(),
  storageRequirements: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  handlingNotes: z.string().optional(),
});

/**
 * GET /api/v1/donations
 * Query donations with filters, pagination, and role awareness
 */
donationRouter.get('/', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const {
      status,
      category,
      city,
      mine,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (mine === 'true') {
      if (!req.user?.organizationId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required to view your organization donations');
      }
      where.donorOrganizationId = req.user.organizationId;
    } else {
      // By default for public feed, show available food unless specific status requested
      if (status) {
        where.status = status as DonationStatus;
      } else {
        where.status = 'AVAILABLE';
        where.pickupDeadline = { gt: new Date() };
      }
    }

    if (category) {
      where.category = category as FoodCategory;
    }

    if (city) {
      where.pickupCity = { contains: city, mode: 'insensitive' };
    }

    const [total, donations] = await Promise.all([
      prisma.donation.count({ where }),
      prisma.donation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          donorOrganization: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true,
              verificationStatus: true,
            },
          },
          rescue: {
            select: {
              id: true,
              status: true,
              recipientOrganizationId: true,
              volunteerId: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      data: donations,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/donations/:id
 * Fetch single donation with organization, rescue state, and timeline
 */
donationRouter.get('/:id', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const donationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donorOrganization: true,
        rescue: {
          include: {
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
        },
      },
    });

    if (!donation) {
      throw new AppError(404, 'NOT_FOUND', 'Donation not found');
    }

    res.status(200).json({ data: donation });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/donations
 * Create surplus food listing (Donors & Admins only)
 */
donationRouter.post(
  '/',
  authenticate,
  requireRole('DONOR', 'ADMIN'),
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const validated = createDonationSchema.parse(req.body);

      // Verify future deadline
      if (new Date(validated.pickupDeadline) <= new Date()) {
        throw new AppError(422, 'INVALID_DEADLINE', 'Pickup deadline must be in the future');
      }

      const donation = await prisma.donation.create({
        data: {
          title: validated.title,
          description: validated.description,
          category: validated.category,
          quantity: validated.quantity,
          unit: validated.unit,
          imageUrl: validated.imageUrl,
          preparedAt: validated.preparedAt ? new Date(validated.preparedAt) : undefined,
          pickupDeadline: new Date(validated.pickupDeadline),
          pickupWindowStart: validated.pickupWindowStart ? new Date(validated.pickupWindowStart) : undefined,
          pickupWindowEnd: validated.pickupWindowEnd ? new Date(validated.pickupWindowEnd) : undefined,
          pickupAddress: validated.pickupAddress,
          pickupCity: validated.pickupCity,
          pickupLatitude: validated.pickupLatitude,
          pickupLongitude: validated.pickupLongitude,
          pickupInstructions: validated.pickupInstructions,
          storageRequirements: validated.storageRequirements,
          allergensJson: validated.allergens ? JSON.stringify(validated.allergens) : '[]',
          handlingNotes: validated.handlingNotes,
          status: 'AVAILABLE',
          donorOrganizationId: req.user!.organizationId!,
          createdById: req.user!.id,
        },
        include: {
          donorOrganization: true,
        },
      });

      // Audit event
      recordAuditEvent({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'DONATION_CREATED',
        resourceType: 'donation',
        resourceId: donation.id,
        details: { quantity: donation.quantity, unit: donation.unit, category: donation.category },
        ipAddress: req.ip,
      });

      // Realtime notification to matching channels
      publishDomainEvent('donation.created', donation.id, 'donation', undefined, req.user!.id);

      res.status(201).json({ data: donation });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/donations/:id/matches
 * Calculate algorithmic matches for recipient organizations
 */
donationRouter.get(
  '/:id/matches',
  authenticate,
  async (req: Request, res: Response, next) => {
    try {
      const donationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const donation = await prisma.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new AppError(404, 'NOT_FOUND', 'Donation not found');
      }

      const matches = await findMatchingRecipients({
        category: donation.category,
        quantity: donation.quantity,
        pickupDeadline: donation.pickupDeadline,
        city: donation.pickupCity,
        latitude: donation.pickupLatitude,
        longitude: donation.pickupLongitude,
      });

      res.status(200).json({ data: matches });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/reserve
 * Atomic Concurrency-Safe Claim/Reservation by Recipient NGO
 */
donationRouter.post(
  '/:id/reserve',
  authenticate,
  requireRole('RECIPIENT', 'ADMIN'),
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const donationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const recipientOrgId = req.user!.organizationId!;

      // Execute single-winner atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch current status with lock/validation
        const existingDonation = await tx.donation.findUnique({
          where: { id: donationId },
          include: { donorOrganization: true },
        });

        if (!existingDonation) {
          throw new AppError(404, 'NOT_FOUND', 'Donation not found');
        }

        if (existingDonation.status !== 'AVAILABLE') {
          throw new AppError(
            409,
            'DONATION_NOT_AVAILABLE',
            `This donation is already ${existingDonation.status.toLowerCase()} and cannot be reserved.`
          );
        }

        if (new Date(existingDonation.pickupDeadline) <= new Date()) {
          throw new AppError(410, 'DONATION_EXPIRED', 'This donation pickup window has expired.');
        }

        // 2. Mark donation as RESERVED
        const updatedDonation = await tx.donation.update({
          where: { id: donationId },
          data: {
            status: 'RESERVED',
          },
        });

        // 3. Create Rescue operation record
        const rescue = await tx.rescue.create({
          data: {
            donationId: existingDonation.id,
            recipientOrganizationId: recipientOrgId,
            status: 'OPEN',
            events: {
              create: {
                eventType: 'rescue.created',
                actorId: req.user!.id,
                actorRole: req.user!.role,
                dataJson: JSON.stringify({
                  claimedByOrg: recipientOrgId,
                  claimedByUserName: req.user!.name,
                }),
              },
            },
          },
          include: {
            recipientOrganization: true,
            events: true,
          },
        });

        return { donation: updatedDonation, rescue, donorOrgId: existingDonation.donorOrganizationId };
      });

      // Audit log
      recordAuditEvent({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'DONATION_RESERVED',
        resourceType: 'donation',
        resourceId: result.donation.id,
        details: { rescueId: result.rescue.id, recipientOrgId },
        ipAddress: req.ip,
      });

      // Publish Realtime Domain Events
      publishDomainEvent(
        'donation.reserved',
        result.donation.id,
        'donation',
        [`org:${result.donorOrgId}`, `org:${recipientOrgId}`, 'food:available'],
        req.user!.id
      );

      publishDomainEvent(
        'rescue.created',
        result.rescue.id,
        'rescue',
        ['rescues:open', 'role:VOLUNTEER', `org:${recipientOrgId}`, `org:${result.donorOrgId}`],
        req.user!.id
      );

      res.status(200).json({
        data: {
          donation: result.donation,
          rescue: result.rescue,
        },
        message: 'Donation successfully reserved. Rescue created and open for volunteer pickup.',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/cancel
 * Cancel a donation with cancellation reason
 */
donationRouter.post(
  '/:id/cancel',
  authenticate,
  async (req: Request, res: Response, next) => {
    try {
      const donationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { reason } = req.body as { reason?: string };

      const result = await prisma.$transaction(async (tx) => {
        const donation = await tx.donation.findUnique({
          where: { id: donationId },
          include: { rescue: true },
        });

        if (!donation) {
          throw new AppError(404, 'NOT_FOUND', 'Donation not found');
        }

        // Authorization check: must be owner organization or admin
        const isOwner = req.user?.organizationId === donation.donorOrganizationId;
        const isAdmin = req.user?.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
          throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own organization donations');
        }

        if (donation.status === 'DELIVERED') {
          throw new AppError(400, 'CANNOT_CANCEL', 'Delivered donations cannot be cancelled');
        }

        const cancelledDonation = await tx.donation.update({
          where: { id: donationId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: reason || 'Cancelled by donor',
          },
        });

        if (donation.rescue && donation.rescue.status !== 'DELIVERED') {
          await tx.rescue.update({
            where: { id: donation.rescue.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: reason || 'Donation cancelled by donor',
            },
          });
        }

        return cancelledDonation;
      });

      // Audit log
      recordAuditEvent({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'DONATION_CANCELLED',
        resourceType: 'donation',
        resourceId: result.id,
        details: { reason },
        ipAddress: req.ip,
      });

      publishDomainEvent('donation.cancelled', result.id, 'donation', undefined, req.user!.id);

      res.status(200).json({ data: result, message: 'Donation successfully cancelled' });
    } catch (err) {
      next(err);
    }
  }
);
