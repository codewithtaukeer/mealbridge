import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole, requireOrganization } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { FoodCategory, QuantityUnit } from '@prisma/client';

export const needRouter = Router();

const updateNeedsSchema = z.object({
  categoriesAccepted: z.array(z.nativeEnum(FoodCategory)),
  maxQuantity: z.number().positive().optional(),
  maxQuantityUnit: z.nativeEnum(QuantityUnit).optional(),
  serviceRadius: z.number().positive().optional(),
  receivingWindowStart: z.string().optional(),
  receivingWindowEnd: z.string().optional(),
  dietaryNotes: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/v1/needs/me
 * Fetch logged-in recipient NGO needs profile
 */
needRouter.get(
  '/me',
  authenticate,
  requireRole('RECIPIENT', 'ADMIN'),
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.user!.organizationId!;
      const need = await prisma.recipientNeed.findUnique({
        where: { organizationId: orgId },
      });

      res.status(200).json({ data: need });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/needs/me
 * Upsert recipient organization needs and intake preferences
 */
needRouter.put(
  '/me',
  authenticate,
  requireRole('RECIPIENT', 'ADMIN'),
  requireOrganization,
  async (req: Request, res: Response, next) => {
    try {
      const orgId = req.user!.organizationId!;
      const validated = updateNeedsSchema.parse(req.body);

      const need = await prisma.recipientNeed.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          categoriesJson: JSON.stringify(validated.categoriesAccepted),
          maxQuantity: validated.maxQuantity,
          maxQuantityUnit: validated.maxQuantityUnit,
          serviceRadius: validated.serviceRadius,
          receivingWindowStart: validated.receivingWindowStart,
          receivingWindowEnd: validated.receivingWindowEnd,
          dietaryNotes: validated.dietaryNotes,
          isActive: validated.isActive ?? true,
        },
        update: {
          categoriesJson: JSON.stringify(validated.categoriesAccepted),
          maxQuantity: validated.maxQuantity,
          maxQuantityUnit: validated.maxQuantityUnit,
          serviceRadius: validated.serviceRadius,
          receivingWindowStart: validated.receivingWindowStart,
          receivingWindowEnd: validated.receivingWindowEnd,
          dietaryNotes: validated.dietaryNotes,
          isActive: validated.isActive ?? true,
        },
      });

      res.status(200).json({
        data: need,
        message: 'Recipient intake criteria and capacity preferences updated',
      });
    } catch (err) {
      next(err);
    }
  }
);
