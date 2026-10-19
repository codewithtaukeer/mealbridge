import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { recordAuditEvent } from '../services/audit';
import { UserRole, OrganizationType } from '@prisma/client';

export const authRouter = Router();

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

    const result = await prisma.$transaction(async (tx) => {
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
 * Return authenticated user and their affiliated organization.
 * Also auto-provisions the user in PostgreSQL if they don't have a DB record yet
 * (important for admin and users who signed up but whose /auth/sync failed).
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;

    // Auto-provision user in DB if they only exist in Supabase Auth
    // Detection: when the JWT fallback was used, req.user.id === req.user.supabaseId (both are Supabase UUID)
    // When loaded from DB, id is a Postgres-generated UUID distinct from supabaseId
    if (user.supabaseId && user.id === user.supabaseId) {
      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseId: user.supabaseId },
              { email: user.email },
            ],
          },
          include: {
            organizationMemberships: { include: { organization: true } },
          },
        });

        if (!existing) {
          // Auto-create the DB user record
          const created = await prisma.user.create({
            data: {
              supabaseId: user.supabaseId,
              email: user.email,
              name: user.name,
              role: user.role as any,
              phone: user.phone,
              emailVerified: true,
              isActive: true,
            },
            include: {
              organizationMemberships: { include: { organization: true } },
            },
          });

          // Respond with the freshly created user
          return res.status(200).json({
            data: {
              user: {
                id: created.id,
                email: created.email,
                name: created.name,
                phone: created.phone,
                role: created.role,
                organizationId: null,
                isActive: created.isActive,
                emailVerified: created.emailVerified,
                createdAt: created.createdAt.toISOString(),
                updatedAt: created.updatedAt.toISOString(),
              },
              organization: null,
            },
          });
        } else {
          // User exists — return it
          const primaryMembership = existing.organizationMemberships?.[0];
          return res.status(200).json({
            data: {
              user: {
                id: existing.id,
                email: existing.email,
                name: existing.name,
                phone: existing.phone,
                role: existing.role,
                organizationId: primaryMembership?.organizationId ?? null,
                isActive: existing.isActive,
                emailVerified: existing.emailVerified,
                createdAt: existing.createdAt.toISOString(),
                updatedAt: existing.updatedAt.toISOString(),
              },
              organization: primaryMembership?.organization
                ? {
                    id: primaryMembership.organization.id,
                    name: primaryMembership.organization.name,
                    type: primaryMembership.organization.type,
                    verificationStatus: primaryMembership.organization.verificationStatus,
                    city: primaryMembership.organization.city,
                    address: primaryMembership.organization.address,
                    phone: primaryMembership.organization.phone,
                    email: primaryMembership.organization.email,
                    description: primaryMembership.organization.description,
                  }
                : undefined,
            },
          });
        }
      } catch (dbErr: any) {
        // DB unavailable — fall through to JWT-only response
        console.warn('[/auth/me] DB auto-provision warning:', dbErr.message);
      }
    }

    // If DB user was loaded by the middleware, return it as normal
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
  } catch (err) {
    next(err);
  }
});
