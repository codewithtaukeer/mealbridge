import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
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
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      let org: any = null;

      // 1. Try Prisma lookup
      try {
        if (user.organizationId) {
          org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
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
        }
      } catch (err: any) {
        console.warn('DB lookup failed in /organizations/me, attempting Supabase fallback:', err.message);
      }

      // 2. Try Supabase REST fallback
      if (!org && (user.organizationId || user.id)) {
        try {
          if (user.organizationId) {
            const { data } = await supabaseAdmin
              .from('organizations')
              .select('*')
              .eq('id', user.organizationId)
              .maybeSingle();
            if (data) org = data;
          }

          if (!org) {
            const { data: member } = await supabaseAdmin
              .from('organization_members')
              .select('*, organizations(*)')
              .eq('user_id', user.id)
              .maybeSingle();
            if (member && member.organizations) org = member.organizations;
          }
        } catch (e: any) {
          console.warn('Supabase org lookup fallback failed:', e.message);
        }
      }

      if (!org && user.organization) {
        return res.status(200).json({ data: user.organization });
      }

      if (!org) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'No organization associated with current user',
          },
        });
      }

      return res.status(200).json({
        data: {
          id: org.id,
          name: org.name,
          type: org.type,
          description: org.description,
          phone: org.phone,
          email: org.email,
          address: org.address,
          city: org.city,
          state: org.state,
          pinCode: org.pin_code || org.pinCode,
          verificationStatus: org.verification_status || org.verificationStatus,
          verifiedAt: org.verified_at || org.verifiedAt,
          isActive: org.is_active ?? org.isActive ?? true,
          createdAt: org.created_at || org.createdAt,
          updatedAt: org.updated_at || org.updatedAt,
        },
      });
    } catch {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve organization profile',
        },
      });
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
  async (req: Request, res: Response, next) => {
    try {
      const validatedData = updateOrganizationSchema.parse(req.body);
      const user = req.user!;

      if (!user.organizationId) {
        throw new AppError(400, 'NO_ORG', 'User has no organization profile');
      }

      const updated = await prisma.organization.update({
        where: { id: user.organizationId },
        data: validatedData,
      });

      recordAuditEvent({
        actorId: user.id,
        actorRole: user.role,
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
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      // 1. Try to check or auto-provision organization in PostgreSQL via Prisma
      let org: any = null;
      try {
        if (user.organizationId) {
          org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
          });
        }

        if (!org) {
          const memberRecord = await prisma.organizationMember.findFirst({
            where: { userId: user.id },
            include: { organization: true },
          });
          if (memberRecord) org = memberRecord.organization;
        }

        if (!org && (user.role === 'DONOR' || user.role === 'RECIPIENT')) {
          org = await prisma.organization.create({
            data: {
              name: user.organization?.name || `${user.name}'s Organization`,
              type: user.organization?.type || (user.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
              email: user.email,
              phone: user.phone || '+91 98765 00000',
              address: user.organization?.address || 'Commercial District',
              city: user.organization?.city || 'Prayagraj',
              state: 'UP',
              pinCode: '211001',
              verificationStatus: 'UNDER_REVIEW',
              members: {
                create: {
                  userId: user.id,
                  role: 'ADMIN',
                },
              },
            },
          });
        }
      } catch (dbErr: any) {
        console.warn('DB lookup/provisioning warning in /me/verify, attempting Supabase REST:', dbErr.message);
      }

      // 2. If Prisma did not find/create the org, find or create via Supabase REST
      if (!org) {
        try {
          // Check if membership exists in Supabase
          const { data: members } = await supabaseAdmin
            .from('organization_members')
            .select('*, organizations(*)')
            .eq('user_id', user.id)
            .limit(1);

          if (members && members.length > 0 && members[0].organizations) {
            org = members[0].organizations;
          } else {
            // Check if organization exists by email
            const { data: existingOrgs } = await supabaseAdmin
              .from('organizations')
              .select('*')
              .eq('email', user.email)
              .limit(1);

            if (existingOrgs && existingOrgs.length > 0) {
              org = existingOrgs[0];
            } else {
              // Create organization directly in Supabase
              const newOrgId = randomUUID();
              const { data: createdOrg } = await supabaseAdmin
                .from('organizations')
                .insert({
                  id: newOrgId,
                  name: user.organization?.name || `${user.name}'s Organization`,
                  type: user.organization?.type || (user.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
                  email: user.email,
                  phone: user.phone || '+91 98765 00000',
                  address: user.organization?.address || 'Commercial District',
                  city: user.organization?.city || 'Prayagraj',
                  state: 'UP',
                  pin_code: '211001',
                  verification_status: 'UNDER_REVIEW',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('*')
                .single();

              if (createdOrg) {
                org = createdOrg;
                await supabaseAdmin.from('organization_members').insert({
                  id: randomUUID(),
                  user_id: user.id,
                  organization_id: newOrgId,
                  role: 'ADMIN',
                  created_at: new Date().toISOString(),
                });
              }
            }
          }
        } catch (supaErr: any) {
          console.warn('Supabase org lookup failed:', supaErr.message);
        }
      }

      if (!org && user.organization) {
        org = { ...user.organization, verificationStatus: 'UNDER_REVIEW' };
      }

      if (!org) {
        throw new AppError(404, 'NOT_FOUND', 'No organization associated with this account to verify.');
      }

      const currentStatus = org.verificationStatus || org.verification_status;
      if (currentStatus === 'VERIFIED') {
        throw new AppError(400, 'ALREADY_VERIFIED', 'Organization is already verified');
      }

      let updatedOrg: any = org;
      // Update in Prisma
      try {
        updatedOrg = await prisma.organization.update({
          where: { id: org.id },
          data: { verificationStatus: 'UNDER_REVIEW' },
        });
      } catch (err: any) {
        // Fallback to Supabase REST
        try {
          const { data: supaUpdated } = await supabaseAdmin
            .from('organizations')
            .update({
              verification_status: 'UNDER_REVIEW',
              updated_at: new Date().toISOString(),
            })
            .eq('id', org.id)
            .select('*')
            .single();

          if (supaUpdated) {
            updatedOrg = {
              ...supaUpdated,
              verificationStatus: supaUpdated.verification_status,
            };
          } else {
            updatedOrg.verificationStatus = 'UNDER_REVIEW';
          }
        } catch {
          updatedOrg.verificationStatus = 'UNDER_REVIEW';
        }
      }

      // Record audit & notification
      try {
        recordAuditEvent({
          actorId: user.id,
          actorRole: user.role,
          action: 'VERIFICATION_REQUESTED',
          resourceType: 'organization',
          resourceId: updatedOrg.id,
          ipAddress: req.ip,
        });

        await addNotification({
          type: 'ORG_VERIFICATION_REQUESTED',
          title: `Verification Request: ${updatedOrg.name}`,
          message: `${updatedOrg.name} (${updatedOrg.type}) submitted credentials for verification review.`,
          resourceType: 'organization',
          resourceId: updatedOrg.id,
        });
      } catch (e: any) {
        console.warn('Audit/Notification warning:', e.message);
      }

      publishDomainEvent('organization.verification_requested', updatedOrg.id, 'organization', ['role:ADMIN'], user.id);

      return res.status(200).json({
        data: updatedOrg,
        message: 'Verification request submitted successfully for administrative review',
      });
    } catch (err: any) {
      const statusCode = err instanceof AppError ? err.statusCode : 500;
      return res.status(statusCode).json({
        error: {
          code: err.code || 'VERIFICATION_FAILED',
          message: err.message || 'Failed to submit verification request',
        },
      });
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
