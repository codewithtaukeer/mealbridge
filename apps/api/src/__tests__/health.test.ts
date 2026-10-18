import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import {
  isValidDonationTransition,
  isValidRescueTransition,
  isValidEmail,
  isPositiveNumber,
} from '@mealbridge/shared';

describe('API Health and Sanity Tests', () => {
  it('GET /health returns 200 with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'mealbridge-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1 returns 200 with API version info', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'MealBridge API');
    expect(res.body).toHaveProperty('version', '1.0.0');
  });

  it('GET /unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});

describe('Shared Domain State Transition Rules', () => {
  it('enforces valid donation transitions', () => {
    expect(isValidDonationTransition('DRAFT', 'AVAILABLE')).toBe(true);
    expect(isValidDonationTransition('AVAILABLE', 'RESERVED')).toBe(true);
    expect(isValidDonationTransition('RESERVED', 'IN_RESCUE')).toBe(true);
    expect(isValidDonationTransition('IN_RESCUE', 'DELIVERED')).toBe(true);
    // Invalid transitions
    expect(isValidDonationTransition('DRAFT', 'DELIVERED')).toBe(false);
    expect(isValidDonationTransition('DELIVERED', 'AVAILABLE')).toBe(false);
    expect(isValidDonationTransition('CANCELLED', 'IN_RESCUE')).toBe(false);
  });

  it('enforces valid rescue transitions', () => {
    expect(isValidRescueTransition('OPEN', 'ASSIGNED')).toBe(true);
    expect(isValidRescueTransition('ASSIGNED', 'PICKED_UP')).toBe(true);
    expect(isValidRescueTransition('PICKED_UP', 'DELIVERED')).toBe(true);
    // Invalid transitions
    expect(isValidRescueTransition('OPEN', 'DELIVERED')).toBe(false);
    expect(isValidRescueTransition('ASSIGNED', 'DELIVERED')).toBe(false);
  });

  it('validates email and positive numbers', () => {
    expect(isValidEmail('donor@example.org')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isPositiveNumber(40)).toBe(true);
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-5)).toBe(false);
  });
});
