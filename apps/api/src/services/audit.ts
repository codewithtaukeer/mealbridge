import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export interface RecordAuditParams {
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function recordAuditEvent(params: RecordAuditParams): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('[AuditService] Failed to record audit event:', err);
  }
}
