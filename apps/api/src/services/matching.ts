import { prisma } from '../lib/prisma';
import type { FoodCategory, MatchResult, Organization } from '@mealbridge/shared';

interface DonationMatchCriteria {
  category: FoodCategory;
  quantity: number;
  pickupDeadline: Date;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Calculates great-circle distance between two coordinates in kilometers (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function findMatchingRecipients(
  criteria: DonationMatchCriteria
): Promise<MatchResult[]> {
  // Query verified recipient organizations
  const recipientOrgs = await prisma.organization.findMany({
    where: {
      type: {
        in: ['NGO', 'COMMUNITY_KITCHEN', 'FOOD_BANK', 'OTHER'],
      },
      verificationStatus: 'VERIFIED',
      isActive: true,
    },
    include: {
      recipientNeeds: true,
    },
  });

  const matches: MatchResult[] = [];

  for (const org of recipientOrgs) {
    let score = 0;
    const reasons: string[] = [];
    const need = org.recipientNeeds[0];

    // 1. Category Matching
    let categoryMatch = true;
    if (need && need.categoriesJson) {
      try {
        const acceptedCategories: string[] = JSON.parse(need.categoriesJson);
        if (acceptedCategories.length > 0) {
          categoryMatch = acceptedCategories.includes(criteria.category);
        }
      } catch {
        categoryMatch = true;
      }
    }

    if (categoryMatch) {
      score += 40;
      reasons.push('Accepts this food category');
    } else {
      reasons.push('Category not in preferred list');
    }

    // 2. Proximity & Distance Calculation
    let distance: number | undefined;
    if (
      criteria.latitude != null &&
      criteria.longitude != null &&
      org.latitude != null &&
      org.longitude != null
    ) {
      distance = calculateDistance(
        criteria.latitude,
        criteria.longitude,
        org.latitude,
        org.longitude
      );

      if (distance <= 5) {
        score += 35;
        reasons.push(`Very close (${distance} km away)`);
      } else if (distance <= 15) {
        score += 25;
        reasons.push(`Within service vicinity (${distance} km away)`);
      } else if (distance <= 30) {
        score += 15;
        reasons.push(`Within regional radius (${distance} km away)`);
      } else {
        score += 5;
        reasons.push(`Extended distance (${distance} km away)`);
      }
    } else if (org.city.toLowerCase() === criteria.city.toLowerCase()) {
      score += 25;
      reasons.push(`Located in same city (${org.city})`);
    } else {
      score += 10;
    }

    // 3. Capacity Compatibility
    let capacityMatch = true;
    if (need?.maxQuantity && need.maxQuantity > 0) {
      if (criteria.quantity <= need.maxQuantity) {
        score += 15;
        reasons.push('Within maximum receiving capacity');
      } else {
        capacityMatch = false;
        reasons.push(`Exceeds preferred batch size (${need.maxQuantity})`);
      }
    } else {
      score += 15;
      reasons.push('Flexible intake capacity');
    }

    // 4. Verification & Operational Readiness
    score += 10;
    reasons.push('Verified active beneficiary organization');

    // 5. Deadline Feasibility
    const deadlineFeasible = new Date(criteria.pickupDeadline) > new Date();

    matches.push({
      organizationId: org.id,
      organization: {
        id: org.id,
        name: org.name,
        type: org.type,
        phone: org.phone,
        email: org.email,
        address: org.address,
        city: org.city,
        state: org.state,
        pinCode: org.pinCode,
        verificationStatus: org.verificationStatus,
        isActive: org.isActive,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      } as Organization,
      score: Math.min(score, 100),
      reasons,
      distance,
      categoryMatch,
      capacityMatch,
      deadlineFeasible,
    });
  }

  // Sort by highest compatibility score first
  return matches.sort((a, b) => b.score - a.score);
}
