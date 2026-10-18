// ============================================================
// MealBridge — Shared Constants
// ============================================================

export const FOOD_CATEGORIES = [
  { value: 'VEGETARIAN_MEALS', label: 'Vegetarian Meals' },
  { value: 'NON_VEGETARIAN_MEALS', label: 'Non-Vegetarian Meals' },
  { value: 'VEGAN_MEALS', label: 'Vegan Meals' },
  { value: 'BAKED_GOODS', label: 'Baked Goods' },
  { value: 'DAIRY', label: 'Dairy Products' },
  { value: 'FRUITS_VEGETABLES', label: 'Fruits & Vegetables' },
  { value: 'GRAINS_CEREALS', label: 'Grains & Cereals' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'PACKAGED_FOOD', label: 'Packaged Food' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const QUANTITY_UNITS = [
  { value: 'PORTIONS', label: 'Portions' },
  { value: 'KILOGRAMS', label: 'Kilograms (kg)' },
  { value: 'LITERS', label: 'Liters (L)' },
  { value: 'BOXES', label: 'Boxes' },
  { value: 'PACKETS', label: 'Packets' },
  { value: 'PIECES', label: 'Pieces' },
] as const;

export const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
  'Celery',
  'Lupin',
  'Molluscs',
  'Sulphites',
] as const;

export const DONATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  IN_RESCUE: 'In Rescue',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
};

export const RESCUE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

// Valid state transitions
export const DONATION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['AVAILABLE', 'CANCELLED'],
  AVAILABLE: ['RESERVED', 'CANCELLED', 'EXPIRED'],
  RESERVED: ['IN_RESCUE', 'AVAILABLE', 'CANCELLED'],
  IN_RESCUE: ['DELIVERED', 'FAILED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
  FAILED: ['AVAILABLE'],
};

export const RESCUE_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['ASSIGNED', 'CANCELLED', 'EXPIRED'],
  ASSIGNED: ['PICKED_UP', 'CANCELLED', 'FAILED'],
  PICKED_UP: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: ['OPEN'],
  EXPIRED: [],
};

export const ROLE_LABELS: Record<string, string> = {
  DONOR: 'Food Donor',
  RECIPIENT: 'Recipient Organisation',
  VOLUNTEER: 'Volunteer',
  ADMIN: 'Administrator',
};

export const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  DONOR: '/donor/dashboard',
  RECIPIENT: '/recipient/dashboard',
  VOLUNTEER: '/volunteer/dashboard',
  ADMIN: '/admin/dashboard',
};
