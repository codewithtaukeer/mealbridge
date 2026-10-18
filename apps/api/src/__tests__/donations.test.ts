import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    donation: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'don-1',
          title: 'Surplus Fresh Sandwiches and Rolls',
          category: 'BAKED_GOODS',
          quantity: 25,
          unit: 'PORTIONS',
          pickupDeadline: new Date(Date.now() + 3600000).toISOString(),
          pickupCity: 'Bangalore',
          status: 'AVAILABLE',
          donorOrganization: {
            id: 'org-1',
            name: 'Café Coffee Central',
            type: 'RESTAURANT',
            city: 'Bangalore',
            verificationStatus: 'VERIFIED',
          },
        },
      ]),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
        if (where.id === 'don-1') {
          return {
            id: 'don-1',
            title: 'Surplus Fresh Sandwiches and Rolls',
            category: 'BAKED_GOODS',
            quantity: 25,
            unit: 'PORTIONS',
            pickupDeadline: new Date(Date.now() + 3600000).toISOString(),
            pickupCity: 'Bangalore',
            status: 'AVAILABLE',
            donorOrganizationId: 'org-1',
            donorOrganization: {
              id: 'org-1',
              name: 'Café Coffee Central',
            },
          };
        }
        return null;
      }),
      create: vi.fn(),
      update: vi.fn(),
    },
    rescue: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'recip-1',
          name: 'Bangalore Food Relief Shelter',
          type: 'NGO',
          city: 'Bangalore',
          latitude: 12.9716,
          longitude: 77.5946,
          verificationStatus: 'VERIFIED',
          isActive: true,
          recipientNeeds: [
            {
              categoriesJson: JSON.stringify(['BAKED_GOODS', 'VEGETARIAN_MEALS']),
              maxQuantity: 100,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      findUnique: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { app } from '../app';
import { findMatchingRecipients } from '../services/matching';

describe('Donations API Routes', () => {
  it('GET /api/v1/donations returns public food listings with pagination', async () => {
    const res = await request(app).get('/api/v1/donations');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
  });

  it('GET /api/v1/donations/:id returns single donation details', async () => {
    const res = await request(app).get('/api/v1/donations/don-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 'don-1');
    expect(res.body.data.category).toBe('BAKED_GOODS');
  });

  it('GET /api/v1/donations/:id returns 404 for non-existent donation', async () => {
    const res = await request(app).get('/api/v1/donations/unknown-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/v1/donations without token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/v1/donations').send({
      title: 'Valid title',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/donations/:id/reserve without token returns 401', async () => {
    const res = await request(app).post('/api/v1/donations/don-1/reserve');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Recipient Matching Engine', () => {
  it('calculates high compatibility score for matching category and city', async () => {
    const matches = await findMatchingRecipients({
      category: 'BAKED_GOODS',
      quantity: 20,
      pickupDeadline: new Date(Date.now() + 7200000),
      city: 'Bangalore',
      latitude: 12.972,
      longitude: 77.595,
    });

    expect(matches).toBeInstanceOf(Array);
    expect(matches.length).toBe(1);
    const topMatch = matches[0];
    expect(topMatch.score).toBeGreaterThanOrEqual(80);
    expect(topMatch.categoryMatch).toBe(true);
    expect(topMatch.capacityMatch).toBe(true);
    expect(topMatch.deadlineFeasible).toBe(true);
  });
});
