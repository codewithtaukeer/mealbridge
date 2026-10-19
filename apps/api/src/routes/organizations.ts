import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireOrganization } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { publishDomainEvent } from '../socket';
import { addNotification } from './notifications';

export const organizationRouter = Router();

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  operatingHoursJson: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

/**
 * GET /api/v1/organizations/me
 * Return current user's organization profile
 */
organizationRouter.get(
  '/me',
  authenticate,
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: req.user!.organizationId! },
        include: {
          recipientNeeds: true,
          _count: {
            select: {
              donations: true,
              recipientRescues: true,
              members: true,
            },
          },
        },
      });

      if (!org) {
        throw new AppError(404, 'NOT_FOUND', 'Organization not found');
      }

      return res.status(200).json({ data: org });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/organizations/me
 * Update current user's organization profile
 */
organizationRouter.patch(
  '/me',
  authenticate,
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const validatedData = updateOrganizationSchema.parse(req.body);

      const updated = await prisma.organization.update({
        where: { id: req.user!.organizationId! },
        data: validatedData,
      });

      recordAuditEvent({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'ORGANIZATION_UPDATED',
        resourceType: 'organization',
        resourceId: updated.id,
        details: validatedData,
        ipAddress: req.ip,
      });

      return res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/organizations/me/verify
 * Request verification for current user's organization
 */
organizationRouter.post(
  '/me/verify',
  authenticate,
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const user = req.user!;
      const orgId = user.organizationId!;

      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (!org) {
        throw new AppError(404, 'NOT_FOUND', 'Organization not found in database');
      }

      if (org.verificationStatus === 'VERIFIED') {
        throw new AppError(400, 'ALREADY_VERIFIED', 'Organization is already verified');
      }

      const updatedOrg = await prisma.organization.update({
        where: { id: org.id },
        data: {
          verificationStatus: 'UNDER_REVIEW',
        },
      });

      recordAuditEvent({
        actorId: user.id,
        actorRole: user.role,
        action: 'VERIFICATION_REQUESTED',
        resourceType: 'organization',
        resourceId: updatedOrg.id,
        ipAddress: req.ip,
      });

      // Notify administrator directly via DB
      await addNotification({
        type: 'ORG_VERIFICATION_REQUESTED',
        title: `Verification Request: ${updatedOrg.name}`,
        message: `${updatedOrg.name} (${updatedOrg.type}) submitted credentials for verification review.`,
        resourceType: 'organization',
        resourceId: updatedOrg.id,
      });

      publishDomainEvent('organization.verification_requested', updatedOrg.id, 'organization', ['role:ADMIN'], user.id);

      return res.status(200).json({
        data: updatedOrg,
        message: 'Verification request submitted successfully for administrative review',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/organizations/:id
 * Get public organization summary
 */
organizationRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        city: true,
        state: true,
        verificationStatus: true,
        createdAt: true,
        _count: {
          select: {
            donations: true,
          },
        },
      },
    });

    if (!org) {
      throw new AppError(404, 'NOT_FOUND', 'Organization not found');
    }

    res.status(200).json({ data: org });
  } catch (err) {
    next(err);
  }
});
