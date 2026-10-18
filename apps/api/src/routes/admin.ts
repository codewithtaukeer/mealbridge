import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { AppError } from '../middleware/error-handler';
import { recordAuditEvent } from '../services/audit';
import { publishDomainEvent } from '../socket';

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(authenticate, requireRole('ADMIN'));

/**
 * GET /api/v1/admin/stats
 * Platform-wide metrics and KPIs
 */
adminRouter.get('/stats', async (_req: Request, res: Response, next) => {
  try {
    const [
      totalUsers,
      totalOrgs,
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

    res.status(200).json({
      data: {
        totalUsers,
        totalOrganizations: totalOrgs,
        pendingVerifications,
        totalDonations,
        totalRescues,
        auditEventsCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/verifications
 * Organizations awaiting administrative review
 */
adminRouter.get('/verifications', async (_req: Request, res: Response, next) => {
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

    res.status(200).json({ data: pendingOrgs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/verifications/:id/approve
 * Approve an organization for active operations
 */
adminRouter.post('/verifications/:id/approve', async (req: Request, res: Response, next) => {
  try {
    const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: req.user!.id,
      },
    });

    recordAuditEvent({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'ORGANIZATION_VERIFIED',
      resourceType: 'organization',
      resourceId: org.id,
      ipAddress: req.ip,
    });

    publishDomainEvent('organization.verified', org.id, 'organization', [`org:${org.id}`], req.user!.id);

    res.status(200).json({ data: org, message: 'Organization verified and approved successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/verifications/:id/reject
 * Reject verification with compliance reason
 */
adminRouter.post('/verifications/:id/reject', async (req: Request, res: Response, next) => {
  try {
    const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body as { reason?: string };

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason || 'Documentation could not be verified by compliance team',
      },
    });

    recordAuditEvent({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'ORGANIZATION_REJECTED',
      resourceType: 'organization',
      resourceId: org.id,
      details: { reason },
      ipAddress: req.ip,
    });

    publishDomainEvent('organization.rejected', org.id, 'organization', [`org:${org.id}`], req.user!.id);

    res.status(200).json({ data: org, message: 'Organization verification rejected' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/organizations
 * Full organization directory
 */
adminRouter.get('/organizations', async (_req: Request, res: Response, next) => {
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
    res.status(200).json({ data: orgs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users
 * User management list
 */
adminRouter.get('/users', async (_req: Request, res: Response, next) => {
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
    res.status(200).json({ data: users });
  } catch (err) {
    next(err);
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
