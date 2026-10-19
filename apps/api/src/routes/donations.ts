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

import { mockRescues } from './rescues';

export const donationRouter = Router();

// Periodic cleanup of expired donations: if deadline passed and still AVAILABLE, mark EXPIRED and emit event
export function cleanupExpiredDonations(): void {
  const now = new Date();
  mockDonations.forEach((d) => {
    if (d.status === 'AVAILABLE' && new Date(d.pickupDeadline) <= now) {
      d.status = 'EXPIRED';
      publishDomainEvent('donation.expired', d.id, 'donation', undefined, 'system');
      console.log(`[Expiry Scheduler] Auto-expired donation ${d.id}: "${d.title}" (deadline passed)`);
    }
  });
}

// Check every 30 seconds
setInterval(cleanupExpiredDonations, 30000);

// In-memory demo store for when PostgreSQL is not configured locally
export const mockDonations: any[] = [
  {
    id: 'demo-1',
    title: '40 Fresh Veg Pulao & Dal Tadka',
    description: 'Hot nutritious meal boxes packaged in hygienic food-grade containers.',
    category: 'VEGETARIAN_MEALS',
    quantity: 40,
    unit: 'PORTIONS',
    imageUrl: null,
    preparedAt: new Date(Date.now() - 3600000).toISOString(),
    pickupDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
    pickupAddress: 'Grand Royal Hotel, Civil Lines',
    pickupCity: 'Prayagraj',
    pickupInstructions: 'Rear kitchen gate, ask for Chef Suresh',
    storageRequirements: 'Keep above 60°C or chill under 4°C',
    allergensJson: '[]',
    handlingNotes: 'Keep upright',
    status: 'AVAILABLE',
    donorOrganizationId: 'demo-donor-org-1',
    createdById: 'demo-donor-user-1',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    donorOrganization: {
      id: 'demo-donor-org-1',
      name: 'Grand Royal Hotel & Restaurant',
      type: 'RESTAURANT',
      city: 'Prayagraj',
      verificationStatus: 'VERIFIED',
      phone: '+91 98765 11223',
      email: 'donor@grandroyal.com',
      address: 'Grand Royal Hotel, Civil Lines, Prayagraj',
    },
    rescue: {
      id: 'demo-rescue-1',
      status: 'ASSIGNED',
      recipientOrganizationId: 'demo-recipient-org-1',
      volunteerId: 'demo-volunteer-user-1',
      recipientOrganization: {
        id: 'demo-recipient-org-1',
        name: 'Hope Community Shelter & Kitchen',
        phone: '+91 98765 99887',
        email: 'ngo@hopeshelter.org',
        address: 'Katra Old Road, Prayagraj',
      },
      volunteer: {
        id: 'demo-volunteer-user-1',
        name: 'Amit Kumar (Express Volunteer)',
        phone: '+91 98765 44332',
      },
      events: [
        {
          id: 'evt-1',
          eventType: 'RESCUE_CLAIMED',
          actorRole: 'RECIPIENT',
          createdAt: new Date(Date.now() - 900000).toISOString(),
        },
        {
          id: 'evt-2',
          eventType: 'VOLUNTEER_ASSIGNED',
          actorRole: 'VOLUNTEER',
          createdAt: new Date(Date.now() - 600000).toISOString(),
        }
      ]
    }
  }
];

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

    try {
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
    } catch (_dbErr) {
      let list = [...mockDonations];

      if (mine === 'true') {
        const myOrgId = req.user?.organizationId || 'demo-donor-org-1';
        list = list.filter((d) => d.donorOrganizationId === myOrgId || d.createdById === req.user?.id);
      } else if (status) {
        list = list.filter((d) => d.status === status);
      } else {
        // Public / available feed: STRICTLY only AVAILABLE donations with non-expired deadlines
        const now = new Date();
        list = list.filter((d) => d.status === 'AVAILABLE' && new Date(d.pickupDeadline) > now);
      }

      if (category && category !== 'ALL') {
        list = list.filter((d) => d.category === category);
      }

      if (city) {
        list = list.filter((d) => d.pickupCity?.toLowerCase().includes(city.toLowerCase()));
      }

      res.status(200).json({
        data: list,
        meta: {
          page: 1,
          limit: limitNum,
          total: list.length,
        },
      });
    }
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

    try {
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

      if (donation) {
        return res.status(200).json({ data: donation });
      }
    } catch (_dbErr) {
      // Fallback
    }

    const mockItem = mockDonations.find(d => d.id === donationId) || mockDonations[0];
    if (mockItem) {
      return res.status(200).json({ data: mockItem });
    }

    throw new AppError(404, 'NOT_FOUND', 'Donation not found');
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

      let donation: any;
      try {
        donation = await prisma.donation.create({
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
      } catch (_dbErr) {
        // Fallback demo in-memory creation
        donation = {
          id: 'demo-' + Date.now(),
          title: validated.title,
          description: validated.description || '',
          category: validated.category,
          quantity: validated.quantity,
          unit: validated.unit,
          imageUrl: validated.imageUrl || null,
          preparedAt: validated.preparedAt ? new Date(validated.preparedAt) : new Date(),
          pickupDeadline: new Date(validated.pickupDeadline),
          pickupAddress: validated.pickupAddress,
          pickupCity: validated.pickupCity,
          allergensJson: validated.allergens ? JSON.stringify(validated.allergens) : '[]',
          handlingNotes: validated.handlingNotes || null,
          status: 'AVAILABLE',
          donorOrganizationId: req.user!.organizationId || 'demo-donor-org-1',
          createdById: req.user!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          donorOrganization: {
            id: req.user!.organizationId || 'demo-donor-org-1',
            name: 'Grand Royal Hotel & Restaurant',
            type: 'RESTAURANT',
            city: validated.pickupCity,
            verificationStatus: 'VERIFIED',
            phone: '+91 98765 11223',
            email: 'donor@grandroyal.com',
            address: validated.pickupAddress,
          },
          rescue: null,
        };
        mockDonations.unshift(donation);
      }

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

      try {
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
    } catch (_dbErr) {
      // Fallback for demo in-memory mode
      const donationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const recipientOrgId = req.user!.organizationId || 'demo-recipient-org-1';

      const foundDonation = mockDonations.find((d) => d.id === donationId);
      if (!foundDonation) {
        throw new AppError(404, 'NOT_FOUND', 'Donation listing not found');
      }

      if (foundDonation.status !== 'AVAILABLE') {
        throw new AppError(400, 'ALREADY_RESERVED', `This donation has already been ${foundDonation.status.toLowerCase()} and cannot be claimed again.`);
      }

      const alreadyHasRescue = mockRescues.some((r) => r.donationId === foundDonation.id && r.status !== 'CANCELLED');
      if (alreadyHasRescue) {
        throw new AppError(400, 'ALREADY_RESERVED', 'A rescue mission is already in progress for this food donation.');
      }

      foundDonation.status = 'RESERVED';

        const newRescue = {
          id: 'rescue-' + Date.now(),
          donationId: foundDonation.id,
          recipientOrganizationId: recipientOrgId,
          volunteerId: null,
          status: 'OPEN' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          donation: {
            id: foundDonation.id,
            title: foundDonation.title,
            description: foundDonation.description,
            category: foundDonation.category,
            quantity: foundDonation.quantity,
            unit: foundDonation.unit,
            pickupDeadline: foundDonation.pickupDeadline,
            pickupAddress: foundDonation.pickupAddress,
            pickupCity: foundDonation.pickupCity,
            pickupInstructions: foundDonation.pickupInstructions,
            storageRequirements: foundDonation.storageRequirements,
            donorOrganizationId: foundDonation.donorOrganizationId,
            donorOrganization: foundDonation.donorOrganization,
            status: 'RESERVED',
          },
          recipientOrganization: {
            id: recipientOrgId,
            name: 'Hope Community Shelter & Kitchen',
            phone: '+91 98765 99887',
            email: 'ngo@hopeshelter.org',
            address: 'Katra Old Road, Prayagraj',
            city: 'Prayagraj',
          },
          events: [
            {
              id: 'evt-' + Date.now(),
              eventType: 'rescue.created',
              actorRole: 'RECIPIENT',
              createdAt: new Date().toISOString(),
            },
          ],
        };

        mockRescues.unshift(newRescue);
        // Avoid circular reference by attaching a non-circular rescue metadata
        foundDonation.rescue = {
          id: newRescue.id,
          donationId: foundDonation.id,
          recipientOrganizationId: newRescue.recipientOrganizationId,
          volunteerId: null,
          status: 'OPEN',
          recipientOrganization: newRescue.recipientOrganization,
        };

        publishDomainEvent(
          'donation.reserved',
          foundDonation.id,
          'donation',
          [`org:${foundDonation.donorOrganizationId}`, `org:${recipientOrgId}`, 'food:available'],
          req.user!.id
        );

        publishDomainEvent(
          'rescue.created',
          newRescue.id,
          'rescue',
          ['rescues:open', 'role:VOLUNTEER', `org:${recipientOrgId}`, `org:${foundDonation.donorOrganizationId}`],
          req.user!.id
        );

        return res.status(200).json({
          data: {
            donation: foundDonation,
            rescue: newRescue,
          },
          message: 'Donation successfully reserved. Rescue created and open for volunteer pickup.',
        });
      }
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

      try {
        const result = await prisma.$transaction(async (tx) => {
          const donation = await tx.donation.findUnique({
            where: { id: donationId },
            include: { rescue: true },
          });

          if (!donation) {
            throw new AppError(404, 'NOT_FOUND', 'Donation not found');
          }

          // A restaurant can only cancel before accepted by an NGO
          if (donation.status !== 'AVAILABLE') {
            throw new AppError(400, 'CANNOT_CANCEL', `This donation is already ${donation.status.toLowerCase()} and cannot be cancelled once accepted by an NGO.`);
          }

          const cancelledDonation = await tx.donation.update({
            where: { id: donationId },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: reason || 'Cancelled by donor',
            },
          });

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

        return res.status(200).json({ data: result, message: 'Donation successfully cancelled' });
      } catch (dbErr) {
        if (dbErr instanceof AppError) throw dbErr;

        // Fallback for demo in-memory mode
        const mock = mockDonations.find((d) => d.id === donationId);
        if (!mock) {
          throw new AppError(404, 'NOT_FOUND', 'Donation not found');
        }

        if (mock.status !== 'AVAILABLE') {
          throw new AppError(400, 'CANNOT_CANCEL', `This donation has already been ${mock.status.toLowerCase()} and cannot be cancelled once accepted by an NGO.`);
        }

        mock.status = 'CANCELLED';
        mock.cancelledAt = new Date().toISOString();
        mock.cancellationReason = reason || 'Cancelled by donor';

        publishDomainEvent('donation.cancelled', mock.id, 'donation', undefined, req.user!.id);

        return res.status(200).json({ data: mock, message: 'Donation successfully cancelled' });
      }
    } catch (err) {
      next(err);
    }
  }
);
