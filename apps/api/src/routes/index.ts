import { Router } from 'express';
import { authRouter } from './auth';
import { organizationRouter } from './organizations';
import { donationRouter, mockDonations } from './donations';
import { rescueRouter, mockRescues } from './rescues';
import { needRouter } from './needs';
import { adminRouter } from './admin';
import { notificationRouter } from './notifications';

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
// POST /api/v1/demo/reset  — resets mock stores to empty state
apiRouter.post('/demo/reset', (_req, res) => {
  mockDonations.length = 0;
  mockRescues.length = 0;
  console.log('[Demo Reset] Mock stores reset to empty state.');
  res.json({ success: true, message: 'Demo stores reset to empty state', donations: 0, rescues: 0 });
});

// Mounted modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/donations', donationRouter);
apiRouter.use('/rescues', rescueRouter);
apiRouter.use('/needs', needRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/analytics', analyticsRouter);
