import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { publishDomainEvent } from '../socket';
import { addNotification } from './notifications';

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(authenticate, requireRole('ADMIN'));

/**
 * GET /api/v1/admin/stats
 * Platform-wide metrics and KPIs
 */
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalOrganizations,
      pendingVerifications,
      totalDonations,
      totalRescues,
      auditEventsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.organization.count({
        where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      }),
      prisma.donation.count(),
      prisma.rescue.count(),
      prisma.auditEvent.count(),
    ]);

    return res.status(200).json({
      data: {
        totalUsers,
        totalOrganizations,
        pendingVerifications,
        totalDonations,
        totalRescues,
        auditEventsCount,
      },
    });
  } catch (err) {
    console.warn('[Admin /stats] Prisma failed, querying Supabase directly:', err);
    try {
      const [uRes, oRes, poRes, dRes, rRes] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('organizations').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('organizations').select('id', { count: 'exact', head: true }).in('verification_status', ['PENDING', 'UNDER_REVIEW']),
        supabaseAdmin.from('donations').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('rescues').select('id', { count: 'exact', head: true }),
      ]);

      return res.status(200).json({
        data: {
          totalUsers: uRes.count ?? 0,
          totalOrganizations: oRes.count ?? 0,
          pendingVerifications: poRes.count ?? 0,
          totalDonations: dRes.count ?? 0,
          totalRescues: rRes.count ?? 0,
          auditEventsCount: 0,
        },
      });
    } catch {
      return res.status(200).json({
        data: {
          totalUsers: 0,
          totalOrganizations: 0,
          pendingVerifications: 0,
          totalDonations: 0,
          totalRescues: 0,
          auditEventsCount: 0,
        },
      });
    }
  }
});

/**
 * GET /api/v1/admin/verifications
 * Organizations awaiting administrative review
 */
adminRouter.get('/verifications', async (_req: Request, res: Response) => {
  try {
    const pendingOrgs = await prisma.organization.findMany({
      where: {
        verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ data: pendingOrgs });
  } catch (err) {
    console.warn('[Admin /verifications] Prisma failed, querying Supabase directly:', err);
    try {
      const { data: supaOrgs, error } = await supabaseAdmin
        .from('organizations')
        .select('*, organization_members(user_id, role, users(id, name, email, phone))')
        .in('verification_status', ['PENDING', 'UNDER_REVIEW'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Admin /verifications] Supabase query error:', error.message);
        return res.status(200).json({ data: [] });
      }

      const formatted = (supaOrgs || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        type: o.type,
        description: o.description,
        phone: o.phone,
        email: o.email,
        address: o.address,
        city: o.city,
        state: o.state,
        pinCode: o.pin_code,
        verificationStatus: o.verification_status,
        verifiedAt: o.verified_at,
        isActive: o.is_active,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        members: (o.organization_members || []).map((m: any) => ({
          role: m.role,
          user: m.users ? {
            id: m.users.id,
            name: m.users.name,
            email: m.users.email,
            phone: m.users.phone,
          } : null,
        })),
      }));

      return res.status(200).json({ data: formatted });
    } catch {
      return res.status(200).json({ data: [] });
    }
  }
});

/**
 * POST /api/v1/admin/verifications/:id/approve
 * Approve an organization for active operations
 */
adminRouter.post('/verifications/:id/approve', async (req: Request, res: Response) => {
  const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const verifiedAt = new Date();
    const approvedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt,
        verifiedById: req.user!.id,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Keep the REST access path aligned with Prisma. Some deployment paths use
    // Supabase REST as a fallback for profile reads, so mirroring is best-effort.
    try {
      const { error: mirrorError } = await supabaseAdmin
        .from('organizations')
        .update({
          verification_status: 'VERIFIED',
          verified_at: verifiedAt.toISOString(),
          verified_by_id: req.user!.id,
          updated_at: verifiedAt.toISOString(),
        })
        .eq('id', orgId);
      if (mirrorError) {
        console.warn('[Admin /approve] Supabase status mirror failed:', mirrorError.message);
      }
    } catch (mirrorErr) {
      console.warn('[Admin /approve] Supabase status mirror failed:', mirrorErr);
    }

    recordAuditEvent({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'ORGANIZATION_VERIFIED',
      resourceType: 'organization',
      resourceId: approvedOrg.id,
      ipAddress: req.ip,
    });

    publishDomainEvent('organization.verified', orgId, 'organization', [`org:${orgId}`], req.user!.id);

    // Create DB notifications for all organization members
    for (const member of approvedOrg.members) {
      await addNotification({
        userId: member.user.id,
        type: 'ORG_VERIFIED',
        title: 'Organization Verified & Approved',
        message: `Your organization "${approvedOrg.name}" has been approved by admin. You now have full operational clearance!`,
        resourceType: 'organization',
        resourceId: orgId,
      });
    }

    return res.status(200).json({ data: approvedOrg, message: 'Organization verified and approved successfully' });
  } catch (err) {
    console.warn('[Admin /approve] Prisma failed, updating via Supabase directly:', err);
    try {
      const { data: supaUpdated, error } = await supabaseAdmin
        .from('organizations')
        .update({
          verification_status: 'VERIFIED',
          verified_at: new Date().toISOString(),
          verified_by_id: req.user!.id,
        })
        .eq('id', orgId)
        .select('*, organization_members(user_id, users(id))')
        .single();

      if (error) {
        return res.status(400).json({ error: { message: error.message } });
      }

      publishDomainEvent('organization.verified', orgId, 'organization', [`org:${orgId}`], req.user!.id);

      // Notify members via addNotification
      for (const m of supaUpdated.organization_members || []) {
        if (m.user_id) {
          await addNotification({
            userId: m.user_id,
            type: 'ORG_VERIFIED',
            title: 'Organization Verified & Approved',
            message: `Your organization "${supaUpdated.name}" has been approved by admin. You now have full operational clearance!`,
            resourceType: 'organization',
            resourceId: orgId,
          });
        }
      }

      return res.status(200).json({ data: supaUpdated, message: 'Organization verified and approved successfully' });
    } catch (e: any) {
      return res.status(500).json({ error: { message: e.message || 'Failed to approve organization' } });
    }
  }
});

/**
 * POST /api/v1/admin/verifications/:id/reject
 * Reject verification with compliance reason
 */
adminRouter.post('/verifications/:id/reject', async (req: Request, res: Response) => {
  const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { reason } = req.body as { reason?: string };
  const rejectReason = reason || 'Incomplete documentation or unverified business registry ID';

  try {
    const rejectedAt = new Date();
    const rejectedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: rejectReason,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Mirror the status for profile reads that take the Supabase REST fallback path.
    try {
      const { error: mirrorError } = await supabaseAdmin
        .from('organizations')
        .update({
          verification_status: 'REJECTED',
          rejection_reason: rejectReason,
          updated_at: rejectedAt.toISOString(),
        })
        .eq('id', orgId);
      if (mirrorError) {
        console.warn('[Admin /reject] Supabase status mirror failed:', mirrorError.message);
      }
    } catch (mirrorErr) {
      console.warn('[Admin /reject] Supabase status mirror failed:', mirrorErr);
    }

    recordAuditEvent({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'ORGANIZATION_REJECTED',
      resourceType: 'organization',
      resourceId: rejectedOrg.id,
      details: { reason: rejectReason },
      ipAddress: req.ip,
    });

    publishDomainEvent('organization.rejected', orgId, 'organization', [`org:${orgId}`], req.user!.id);

    for (const member of rejectedOrg.members) {
      await addNotification({
        userId: member.user.id,
        type: 'ORG_REJECTED',
        title: 'Verification Request Update',
        message: `Your organization verification could not be approved. Reason: ${rejectReason}`,
        resourceType: 'organization',
        resourceId: orgId,
      });
    }

    return res.status(200).json({ data: rejectedOrg, message: 'Organization verification rejected' });
  } catch (err) {
    console.warn('[Admin /reject] Prisma failed, updating via Supabase directly:', err);
    try {
      const { data: supaUpdated, error } = await supabaseAdmin
        .from('organizations')
        .update({
          verification_status: 'REJECTED',
          rejection_reason: rejectReason,
        })
        .eq('id', orgId)
        .select('*, organization_members(user_id, users(id))')
        .single();

      if (error) {
        return res.status(400).json({ error: { message: error.message } });
      }

      publishDomainEvent('organization.rejected', orgId, 'organization', [`org:${orgId}`], req.user!.id);

      for (const m of supaUpdated.organization_members || []) {
        if (m.user_id) {
          await addNotification({
            userId: m.user_id,
            type: 'ORG_REJECTED',
            title: 'Verification Request Update',
            message: `Your organization verification could not be approved. Reason: ${rejectReason}`,
            resourceType: 'organization',
            resourceId: orgId,
          });
        }
      }

      return res.status(200).json({ data: supaUpdated, message: 'Organization verification rejected' });
    } catch (e: any) {
      return res.status(500).json({ error: { message: e.message || 'Failed to reject organization' } });
    }
  }
});

/**
 * GET /api/v1/admin/organizations
 * Full organization directory
 */
adminRouter.get('/organizations', async (_req: Request, res: Response) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            donations: true,
            recipientRescues: true,
            members: true,
          },
        },
      },
    });

    return res.status(200).json({ data: orgs });
  } catch (err) {
    console.warn('[Admin /organizations] Prisma failed, querying Supabase directly:', err);
    try {
      const { data: supaOrgs, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(200).json({ data: [] });
      }

      const formatted = (supaOrgs || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        type: o.type,
        description: o.description,
        phone: o.phone,
        email: o.email,
        address: o.address,
        city: o.city,
        state: o.state,
        pinCode: o.pin_code,
        verificationStatus: o.verification_status,
        verifiedAt: o.verified_at,
        isActive: o.is_active,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        _count: { donations: 0, recipientRescues: 0, members: 1 },
      }));

      return res.status(200).json({ data: formatted });
    } catch {
      return res.status(200).json({ data: [] });
    }
  }
});

/**
 * GET /api/v1/admin/users
 * User management list
 */
adminRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ data: users });
  } catch (err) {
    console.warn('[Admin /users] Prisma failed, querying Supabase directly:', err);
    try {
      const { data: supaUsers, error } = await supabaseAdmin
        .from('users')
        .select('*, organization_members(role, organizations(id, name, type))')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(200).json({ data: [] });
      }

      const formatted = (supaUsers || []).map((u: any) => ({
        id: u.id,
        supabaseId: u.supabase_id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        emailVerified: u.email_verified,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        organizationMemberships: (u.organization_members || []).map((m: any) => ({
          role: m.role,
          organization: m.organizations ? {
            id: m.organizations.id,
            name: m.organizations.name,
            type: m.organizations.type,
          } : null,
        })),
      }));

      return res.status(200).json({ data: formatted });
    } catch {
      return res.status(200).json({ data: [] });
    }
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Chronological audit trail
 */
adminRouter.get('/audit-logs', async (_req: Request, res: Response, next) => {
  try {
    const logs = await prisma.auditEvent.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(200).json({ data: logs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/reports
 * Incident and dispute reports
 */
adminRouter.get('/reports', async (_req: Request, res: Response, next) => {
  try {
    const reports = await prisma.incidentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json({ data: reports });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/organizations/:id/block
 * Admin block or suspend an organization
 */
adminRouter.post('/organizations/:id/block', async (req: Request, res: Response, next) => {
  const id = String(req.params.id);
  const { reason } = req.body;

  try {
    await prisma.organization.update({
      where: { id },
      data: { isActive: false, verificationStatus: 'SUSPENDED', rejectionReason: reason || 'Suspended by platform administrator' },
    });

    res.status(200).json({ data: { success: true, message: 'Organization blocked and suspended from platform' } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/users/:id/deactivate
 * Admin deactivate volunteer, donor, or recipient user
 */
adminRouter.post('/users/:id/deactivate', async (req: Request, res: Response, next) => {
  const id = String(req.params.id);

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ data: { success: true, message: 'User account deactivated successfully' } });
  } catch (err) {
    next(err);
  }
});
