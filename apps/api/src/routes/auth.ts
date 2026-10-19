import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { recordAuditEvent } from '../services/audit';
import { UserRole, OrganizationType } from '@prisma/client';

import { supabaseAdmin } from '../lib/supabase';
import { randomUUID } from 'crypto';

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
 * Idempotently synchronize or create User and optional Organization in PostgreSQL/Supabase
 */
authRouter.post('/sync', async (req: Request, res: Response) => {
  const validatedData = syncUserSchema.parse(req.body);

  try {
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

    recordAuditEvent({
      actorId: result.user.id,
      actorRole: result.user.role,
      action: 'USER_SYNCED',
      resourceType: 'user',
      resourceId: result.user.id,
      details: { role: result.user.role, hasOrg: !!result.organization },
      ipAddress: req.ip,
    });

    return res.status(200).json({
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
    console.warn('[/auth/sync] Prisma transaction failed, falling back to Supabase REST API:', err);
    try {
      // 1. Find or create user via Supabase REST
      let userId: string = '';
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`supabase_id.eq.${validatedData.supabaseId},email.eq.${validatedData.email}`)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await supabaseAdmin
          .from('users')
          .update({
            name: validatedData.name,
            phone: validatedData.phone || existingUsers[0].phone,
            role: validatedData.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } else {
        userId = randomUUID();
        await supabaseAdmin.from('users').insert({
          id: userId,
          supabase_id: validatedData.supabaseId,
          email: validatedData.email,
          name: validatedData.name,
          role: validatedData.role,
          phone: validatedData.phone || null,
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Check or create organization if DONOR or RECIPIENT
      let orgData: any = null;
      if (
        (validatedData.role === 'DONOR' || validatedData.role === 'RECIPIENT') &&
        validatedData.organizationName
      ) {
        // Check existing membership
        const { data: members } = await supabaseAdmin
          .from('organization_members')
          .select('*, organizations(*)')
          .eq('user_id', userId)
          .limit(1);

        if (members && members.length > 0 && members[0].organizations) {
          orgData = members[0].organizations;
        } else {
          const orgId = randomUUID();
          const { data: createdOrg } = await supabaseAdmin
            .from('organizations')
            .insert({
              id: orgId,
              name: validatedData.organizationName,
              type: validatedData.organizationType || (validatedData.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
              email: validatedData.email,
              phone: validatedData.phone || 'N/A',
              address: validatedData.organizationAddress || validatedData.city || 'Address pending',
              city: validatedData.city || 'City pending',
              state: validatedData.state || 'State pending',
              pin_code: validatedData.pinCode || '000000',
              verification_status: 'PENDING',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('*')
            .single();

          if (createdOrg) {
            orgData = createdOrg;
            await supabaseAdmin.from('organization_members').insert({
              id: randomUUID(),
              user_id: userId,
              organization_id: orgId,
              role: 'ADMIN',
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      return res.status(200).json({
        data: {
          user: {
            id: userId,
            email: validatedData.email,
            name: validatedData.name,
            phone: validatedData.phone,
            role: validatedData.role,
            organizationId: orgData?.id,
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          organization: orgData
            ? {
                id: orgData.id,
                name: orgData.name,
                type: orgData.type,
                verificationStatus: orgData.verification_status,
                city: orgData.city,
                address: orgData.address,
                phone: orgData.phone,
                email: orgData.email,
              }
            : undefined,
        },
      });
    } catch (fallbackErr: any) {
      console.error('[/auth/sync] Fallback to Supabase failed:', fallbackErr);
      return res.status(200).json({
        data: {
          user: {
            id: validatedData.supabaseId,
            email: validatedData.email,
            name: validatedData.name,
            phone: validatedData.phone,
            role: validatedData.role,
            organizationId: undefined,
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }
  }
});

/**
 * GET /api/v1/auth/me
 * Return authenticated user and their affiliated organization.
 * Tries Prisma DB first, then falls back to Supabase REST when the DB pooler is unavailable.
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;

    // When the JWT fallback was used in auth middleware, user.id === user.supabaseId
    // (since the middleware couldn't look up the DB record). We need to fetch real user data.
    if (user.supabaseId && user.id === user.supabaseId) {

      // --- Attempt 1: Prisma DB lookup/provision ---
      let existingDbUser: any = null;
      try {
        existingDbUser = await prisma.user.findFirst({
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

        if (!existingDbUser) {
          // Auto-create the DB user record
          existingDbUser = await prisma.user.create({
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
        }
      } catch (dbErr: any) {
        console.warn('[/auth/me] Prisma lookup/provision warning:', dbErr.message);
      }

      if (existingDbUser) {
        const primaryMembership = existingDbUser.organizationMemberships?.[0];
        const org = primaryMembership?.organization;
        return res.status(200).json({
          data: {
            user: {
              id: existingDbUser.id,
              email: existingDbUser.email,
              name: existingDbUser.name,
              phone: existingDbUser.phone,
              role: existingDbUser.role,
              organizationId: primaryMembership?.organizationId ?? null,
              isActive: existingDbUser.isActive,
              emailVerified: existingDbUser.emailVerified,
              createdAt: existingDbUser.createdAt instanceof Date
                ? existingDbUser.createdAt.toISOString()
                : existingDbUser.createdAt,
              updatedAt: existingDbUser.updatedAt instanceof Date
                ? existingDbUser.updatedAt.toISOString()
                : existingDbUser.updatedAt,
            },
            organization: org
              ? {
                  id: org.id,
                  name: org.name,
                  type: org.type,
                  verificationStatus: org.verificationStatus,
                  city: org.city,
                  address: org.address,
                  phone: org.phone,
                  email: org.email,
                  description: org.description,
                }
              : undefined,
          },
        });
      }

      // --- Attempt 2: Supabase REST fallback ---
      try {
        const { data: supaUsers } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`supabase_id.eq.${user.supabaseId},email.eq.${user.email}`)
          .limit(1);

        const supaUser = supaUsers?.[0];

        if (supaUser) {
          // Look up org via membership
          const { data: members } = await supabaseAdmin
            .from('organization_members')
            .select('*, organizations(*)')
            .eq('user_id', supaUser.id)
            .limit(1);

          const org = members?.[0]?.organizations || null;

          return res.status(200).json({
            data: {
              user: {
                id: supaUser.id,
                email: supaUser.email,
                name: supaUser.name,
                phone: supaUser.phone,
                role: supaUser.role,
                organizationId: org?.id ?? null,
                isActive: supaUser.is_active,
                emailVerified: supaUser.email_verified,
                createdAt: supaUser.created_at,
                updatedAt: supaUser.updated_at,
              },
              organization: org
                ? {
                    id: org.id,
                    name: org.name,
                    type: org.type,
                    verificationStatus: org.verification_status,
                    city: org.city,
                    address: org.address,
                    phone: org.phone,
                    email: org.email,
                    description: org.description,
                  }
                : undefined,
            },
          });
        }
      } catch (supaErr: any) {
        console.warn('[/auth/me] Supabase REST fallback failed:', supaErr.message);
      }
    }

    // Default path: DB user was already loaded by auth middleware (id !== supabaseId)
    // OR Supabase fallbacks all failed — return what we have from middleware
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
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : (user.createdAt as string),
          updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : (user.updatedAt as string),
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
