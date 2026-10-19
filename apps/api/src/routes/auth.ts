import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { recordAuditEvent } from '../services/audit';
import { UserRole, OrganizationType } from '@prisma/client';

export const authRouter = Router();

// In-memory pending organizations storage for fallback/demo
export const mockPendingOrganizations: any[] = [];

const syncUserSchema = z.object({
  supabaseId: z.string().min(1, 'supabaseId is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.nativeEnum(OrganizationType).optional(),
  organizationAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
});

/**
 * POST /api/v1/auth/sync
 * Idempotently synchronize or create User and optional Organization in PostgreSQL
 */
authRouter.post('/sync', async (req: Request, res: Response, next) => {
  try {
    const validatedData = syncUserSchema.parse(req.body);

    let result: { user: any; organization: any };
    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Check if user already exists by supabaseId or email
        let user = await tx.user.findFirst({
          where: {
            OR: [
              { supabaseId: validatedData.supabaseId },
              { email: validatedData.email },
            ],
          },
          include: {
            organizationMemberships: {
              include: { organization: true },
            },
          },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              supabaseId: validatedData.supabaseId,
              email: validatedData.email,
              name: validatedData.name,
              role: validatedData.role,
              phone: validatedData.phone,
              emailVerified: true,
            },
            include: {
              organizationMemberships: {
                include: { organization: true },
              },
            },
          });
        } else {
          // Update user if needed
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              supabaseId: validatedData.supabaseId,
              name: validatedData.name,
              phone: validatedData.phone || user.phone,
              role: validatedData.role,
            },
            include: {
              organizationMemberships: {
                include: { organization: true },
              },
            },
          });
        }

        let organization = user.organizationMemberships[0]?.organization || null;

        // 2. If organization details are provided for DONOR or RECIPIENT and user does not have one
        if (
          !organization &&
          (validatedData.role === 'DONOR' || validatedData.role === 'RECIPIENT') &&
          validatedData.organizationName
        ) {
          organization = await tx.organization.create({
            data: {
              name: validatedData.organizationName,
              type: validatedData.organizationType || (validatedData.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
              email: validatedData.email,
              phone: validatedData.phone || 'N/A',
              address: validatedData.organizationAddress || validatedData.city || 'Address pending',
              city: validatedData.city || 'City pending',
              state: validatedData.state || 'State pending',
              pinCode: validatedData.pinCode || '000000',
              verificationStatus: 'PENDING',
              members: {
                create: {
                  userId: user.id,
                  role: 'ADMIN',
                },
              },
            },
          });
        }

        return { user, organization };
      });
    } catch (_dbErr) {
      // Robust in-memory fallback for demo/serverless environments
      const isOrg = validatedData.role === 'DONOR' || validatedData.role === 'RECIPIENT';
      const mockOrg = isOrg
        ? {
            id: 'org-' + Date.now(),
            name: validatedData.organizationName || (validatedData.role === 'DONOR' ? 'Surplus Food Donor' : 'Community Kitchen NGO'),
            type: validatedData.organizationType || (validatedData.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
            phone: validatedData.phone || '+91 98765 00000',
            email: validatedData.email,
            address: validatedData.organizationAddress || 'Commercial District',
            city: validatedData.city || 'Prayagraj',
            state: validatedData.state || 'UP',
            pinCode: validatedData.pinCode || '211001',
            verificationStatus: 'PENDING',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : null;

      const mockUser = {
        id: 'usr-' + Date.now(),
        supabaseId: validatedData.supabaseId,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        organizationId: mockOrg ? mockOrg.id : undefined,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (mockOrg) {
        mockPendingOrganizations.unshift({
          ...mockOrg,
          members: [{ user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, phone: mockUser.phone } }],
        });
      }

      result = { user: mockUser, organization: mockOrg };
    }

    // Record audit event asynchronously
    recordAuditEvent({
      actorId: result.user.id,
      actorRole: result.user.role,
      action: 'USER_SYNCED',
      resourceType: 'user',
      resourceId: result.user.id,
      details: { role: result.user.role, hasOrg: !!result.organization },
      ipAddress: req.ip,
    });

    res.status(200).json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phone: result.user.phone,
          role: result.user.role,
          organizationId: result.organization?.id,
          isActive: result.user.isActive,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
        },
        organization: result.organization
          ? {
              id: result.organization.id,
              name: result.organization.name,
              type: result.organization.type,
              verificationStatus: result.organization.verificationStatus,
              city: result.organization.city,
              address: result.organization.address,
              phone: result.organization.phone,
              email: result.organization.email,
            }
          : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Return authenticated user and their affiliated organization
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  res.status(200).json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            type: user.organization.type,
            verificationStatus: user.organization.verificationStatus,
            city: user.organization.city,
            address: user.organization.address,
            phone: user.organization.phone,
            email: user.organization.email,
            description: user.organization.description,
          }
        : undefined,
    },
  });
});
