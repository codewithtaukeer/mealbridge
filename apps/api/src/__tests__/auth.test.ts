import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response } from 'express';
import { AppError } from '../middleware/error-handler';
import { requireRole, requireOrganization, requireVerifiedOrganization } from '../middleware/rbac';

// Mock Prisma for unit and route-level tests
vi.mock('../lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
        if (where.id === 'org-verified-1') {
          return {
            id: 'org-verified-1',
            name: 'Akshaya Patra Foundation',
            type: 'NGO',
            description: 'Mid-day meal provider',
            city: 'Bangalore',
            state: 'Karnataka',
            verificationStatus: 'VERIFIED',
            createdAt: new Date().toISOString(),
            _count: { donations: 12 },
          };
        }
        return null;
      }),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { app } from '../app';

describe('Auth & Organization Route Security', () => {
  it('GET /api/v1/auth/me without authorization header returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me with invalid bearer token returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/v1/auth/sync rejects invalid payload with 422 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sync')
      .send({
        email: 'not-an-email',
        name: '',
      });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('GET /api/v1/organizations/me without authorization header returns 401', async () => {
    const res = await request(app).get('/api/v1/organizations/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/organizations/:id returns 404 for unknown organization', async () => {
    const res = await request(app).get('/api/v1/organizations/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/organizations/:id returns 200 with data for existing organization', async () => {
    const res = await request(app).get('/api/v1/organizations/org-verified-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe('org-verified-1');
    expect(res.body.data.name).toBe('Akshaya Patra Foundation');
    expect(res.body.data.verificationStatus).toBe('VERIFIED');
  });
});

describe('RBAC Middleware Logic', () => {
  it('requireRole allows request when user has authorized role', () => {
    const req = {
      user: {
        id: 'user-1',
        role: 'DONOR',
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextCalled = false;
    let nextError: unknown = null;

    const middleware = requireRole('DONOR', 'ADMIN');
    middleware(req, res, (err?: unknown) => {
      nextCalled = true;
      nextError = err;
    });

    expect(nextCalled).toBe(true);
    expect(nextError).toBeUndefined();
  });

  it('requireRole rejects request when user has unauthorized role with 403 FORBIDDEN', () => {
    const req = {
      user: {
        id: 'user-2',
        role: 'VOLUNTEER',
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextError: unknown = null;

    const middleware = requireRole('DONOR', 'RECIPIENT');
    middleware(req, res, (err?: unknown) => {
      nextError = err;
    });

    expect(nextError).toBeInstanceOf(AppError);
    expect((nextError as AppError).statusCode).toBe(403);
    expect((nextError as AppError).code).toBe('FORBIDDEN');
  });

  it('requireOrganization passes when user has affiliated organization', () => {
    const req = {
      user: {
        id: 'user-3',
        role: 'DONOR',
        organizationId: 'org-123',
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextCalled = false;
    let nextError: unknown = null;

    requireOrganization(req, res, (err?: unknown) => {
      nextCalled = true;
      nextError = err;
    });

    expect(nextCalled).toBe(true);
    expect(nextError).toBeUndefined();
  });

  it('requireOrganization throws error when user has no organization', () => {
    const req = {
      user: {
        id: 'user-4',
        role: 'VOLUNTEER',
        organizationId: null,
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextError: unknown = null;

    requireOrganization(req, res, (err?: unknown) => {
      nextError = err;
    });

    expect(nextError).toBeInstanceOf(AppError);
    expect((nextError as AppError).statusCode).toBe(400);
    expect((nextError as AppError).code).toBe('ORGANIZATION_REQUIRED');
  });

  it('requireVerifiedOrganization throws error when organization is unverified', () => {
    const req = {
      user: {
        id: 'user-5',
        role: 'DONOR',
        organizationId: 'org-pending',
        organization: {
          id: 'org-pending',
          verificationStatus: 'PENDING',
        },
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextError: unknown = null;

    requireVerifiedOrganization(req, res, (err?: unknown) => {
      nextError = err;
    });

    expect(nextError).toBeInstanceOf(AppError);
    expect((nextError as AppError).statusCode).toBe(403);
    expect((nextError as AppError).code).toBe('ORGANIZATION_NOT_VERIFIED');
  });

  it('requireVerifiedOrganization passes when organization is VERIFIED', () => {
    const req = {
      user: {
        id: 'user-6',
        role: 'DONOR',
        organizationId: 'org-verified-1',
        organization: {
          id: 'org-verified-1',
          verificationStatus: 'VERIFIED',
        },
      },
    } as unknown as Request;
    const res = {} as Response;
    let nextCalled = false;
    let nextError: unknown = null;

    requireVerifiedOrganization(req, res, (err?: unknown) => {
      nextCalled = true;
      nextError = err;
    });

    expect(nextCalled).toBe(true);
    expect(nextError).toBeUndefined();
  });
});
