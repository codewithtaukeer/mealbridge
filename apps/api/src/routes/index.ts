import { Router } from 'express';
import { authRouter } from './auth';
import { organizationRouter } from './organizations';
import { donationRouter } from './donations';
import { rescueRouter } from './rescues';
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

// Mounted modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/donations', donationRouter);
apiRouter.use('/rescues', rescueRouter);
apiRouter.use('/needs', needRouter);
apiRouter.use('/admin', adminRouter);
// apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/analytics', analyticsRouter);
