import { Router } from 'express';
import { authRouter } from './auth';
import { organizationRouter } from './organizations';
import { donationRouter, mockDonations } from './donations';
import { rescueRouter, mockRescues } from './rescues';
import { needRouter } from './needs';
import { adminRouter } from './admin';

export const apiRouter = Router();

// Health & Discovery
apiRouter.get('/', (_req, res) => {
  res.json({
    service: 'MealBridge API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// ─── Demo Reset Endpoint ─────────────────────────────────────────────────────
// POST /api/v1/demo/reset  — resets mock stores to pristine initial state
apiRouter.post('/demo/reset', (_req, res) => {
  const now = Date.now();

  // Reset donations
  mockDonations.length = 0;
  mockDonations.push({
    id: 'demo-1',
    title: '40 Fresh Veg Pulao & Dal Tadka',
    description: 'Hot nutritious meal boxes packaged in hygienic food-grade containers.',
    category: 'VEGETARIAN_MEALS',
    quantity: 40,
    unit: 'PORTIONS',
    imageUrl: null,
    preparedAt: new Date(now - 3600000).toISOString(),
    pickupDeadline: new Date(now + 4 * 3600000).toISOString(),
    pickupAddress: 'Grand Royal Hotel, Civil Lines',
    pickupCity: 'Prayagraj',
    pickupInstructions: 'Rear kitchen gate, ask for Chef Suresh',
    storageRequirements: 'Keep above 60°C or chill under 4°C',
    allergensJson: '[]',
    handlingNotes: 'Keep upright',
    status: 'AVAILABLE',
    donorOrganizationId: 'demo-donor-org-1',
    createdById: 'demo-donor-user-1',
    createdAt: new Date(now - 1800000).toISOString(),
    updatedAt: new Date(now - 1800000).toISOString(),
    donorOrganization: {
      id: 'demo-donor-org-1',
      name: 'Grand Royal Hotel & Restaurant',
      type: 'RESTAURANT',
      city: 'Prayagraj',
      verificationStatus: 'VERIFIED',
      phone: '+91 98765 11223',
      email: 'donor@grandroyal.com',
      address: 'Grand Royal Hotel, Civil Lines, Prayagraj',
    },
    rescue: null,
  });

  // Reset rescues
  mockRescues.length = 0;

  console.log('[Demo Reset] Mock stores reset to pristine state. 1 AVAILABLE donation, 0 rescues.');
  res.json({ success: true, message: 'Demo stores reset to initial state', donations: mockDonations.length, rescues: mockRescues.length });
});

// Mounted modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/donations', donationRouter);
apiRouter.use('/rescues', rescueRouter);
apiRouter.use('/needs', needRouter);
apiRouter.use('/admin', adminRouter);
// apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/analytics', analyticsRouter);
