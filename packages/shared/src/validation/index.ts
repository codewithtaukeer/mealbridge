// ============================================================
// MealBridge — Shared Validation Helpers
// ============================================================

import { DONATION_TRANSITIONS, RESCUE_TRANSITIONS } from '../constants';

export function isValidDonationTransition(from: string, to: string): boolean {
  return DONATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidRescueTransition(from: string, to: string): boolean {
  return RESCUE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s-()]/g, ''));
}

export function isFutureDate(date: string | Date): boolean {
  return new Date(date) > new Date();
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && isFinite(value);
}
