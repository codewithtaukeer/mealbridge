// ============================================================
// MealBridge — Shared Type Definitions
// ============================================================

// --- User & Auth ---
export type UserRole = 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  organizationId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// --- Organisation ---
export type OrganizationType = 'RESTAURANT' | 'HOTEL' | 'CATERER' | 'CANTEEN' | 'EVENT_ORGANIZER' | 'NGO' | 'COMMUNITY_KITCHEN' | 'FOOD_BANK' | 'OTHER';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: OperatingHours;
  logoUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

// --- Donation ---
export type DonationStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'IN_RESCUE' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
export type FoodCategory = 'VEGETARIAN_MEALS' | 'NON_VEGETARIAN_MEALS' | 'VEGAN_MEALS' | 'BAKED_GOODS' | 'DAIRY' | 'FRUITS_VEGETABLES' | 'GRAINS_CEREALS' | 'BEVERAGES' | 'PACKAGED_FOOD' | 'OTHER';
export type QuantityUnit = 'PORTIONS' | 'KILOGRAMS' | 'LITERS' | 'BOXES' | 'PACKETS' | 'PIECES';

export interface Donation {
  id: string;
  title: string;
  description?: string;
  category: FoodCategory;
  quantity: number;
  unit: QuantityUnit;
  imageUrl?: string;
  preparedAt?: string;
  pickupDeadline: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  pickupAddress: string;
  pickupCity: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupInstructions?: string;
  storageRequirements?: string;
  allergens: string[];
  handlingNotes?: string;
  status: DonationStatus;
  donorOrganizationId: string;
  donorOrganization?: Organization;
  rescue?: Rescue;
  createdById: string;
  cancelledAt?: string;
  cancellationReason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationInput {
  title: string;
  description?: string;
  category: FoodCategory;
  quantity: number;
  unit: QuantityUnit;
  imageUrl?: string;
  preparedAt?: string;
  pickupDeadline: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  pickupAddress: string;
  pickupCity: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupInstructions?: string;
  storageRequirements?: string;
  allergens?: string[];
  handlingNotes?: string;
}

// --- Rescue ---
export type RescueStatus = 'OPEN' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED' | 'FAILED' | 'EXPIRED';

export interface Rescue {
  id: string;
  donationId: string;
  donation?: Donation;
  recipientOrganizationId: string;
  recipientOrganization?: Organization;
  volunteerId?: string;
  volunteer?: User;
  status: RescueStatus;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  failureReason?: string;
  pickupNotes?: string;
  deliveryNotes?: string;
  deliveryEvidence?: string;
  createdAt: string;
  updatedAt: string;
  events?: RescueEvent[];
}

export interface RescueEvent {
  id: string;
  rescueId: string;
  eventType: string;
  actorId: string;
  actorRole: UserRole;
  data?: Record<string, unknown>;
  createdAt: string;
}

// --- Recipient Needs ---
export interface RecipientNeed {
  id: string;
  organizationId: string;
  categoriesAccepted: FoodCategory[];
  maxQuantity?: number;
  maxQuantityUnit?: QuantityUnit;
  serviceRadius?: number;
  receivingWindowStart?: string;
  receivingWindowEnd?: string;
  dietaryNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Notifications ---
export type NotificationType = 
  | 'DONATION_CREATED' | 'DONATION_RESERVED' | 'DONATION_CANCELLED' | 'DONATION_EXPIRED'
  | 'RESCUE_CREATED' | 'RESCUE_ASSIGNED' | 'RESCUE_PICKUP_CONFIRMED' | 'RESCUE_DELIVERY_CONFIRMED' | 'RESCUE_FAILED' | 'RESCUE_CANCELLED'
  | 'ORG_VERIFICATION_REQUESTED' | 'ORG_VERIFIED' | 'ORG_REJECTED'
  | 'REPORT_CREATED' | 'REPORT_UPDATED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// --- Audit ---
export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// --- Incident Reports ---
export type ReportCategory = 'FOOD_SAFETY' | 'OPERATIONAL' | 'ABUSE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface IncidentReport {
  id: string;
  reporterId: string;
  category: ReportCategory;
  description: string;
  donationId?: string;
  rescueId?: string;
  organizationId?: string;
  status: ReportStatus;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Match ---
export interface MatchResult {
  organizationId: string;
  organization: Organization;
  score: number;
  reasons: string[];
  distance?: number;
  categoryMatch: boolean;
  capacityMatch: boolean;
  deadlineFeasible: boolean;
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, string[]>;
}

// --- Pagination ---
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// --- Domain Events (Socket.IO) ---
export type DomainEventType =
  | 'donation.created' | 'donation.updated' | 'donation.reserved' | 'donation.cancelled' | 'donation.expired'
  | 'rescue.created' | 'rescue.assigned' | 'rescue.pickup_confirmed' | 'rescue.delivery_confirmed' | 'rescue.failed' | 'rescue.cancelled' | 'rescue.reassigned'
  | 'organization.verification_requested' | 'organization.verified' | 'organization.rejected'
  | 'report.created' | 'report.updated'
  | 'notification.created' | 'notification.read';

export interface DomainEvent {
  type: DomainEventType;
  entityId: string;
  entityType: string;
  timestamp: string;
  actorId?: string;
  data?: Record<string, any>;
}
