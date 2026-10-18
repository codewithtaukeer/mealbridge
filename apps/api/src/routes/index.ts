import { Router } from 'express';
import { authRouter } from './auth';
import { organizationRouter } from './organizations';

export const apiRouter = Router();

// Health
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
// apiRouter.use('/donations', donationRouter);
// apiRouter.use('/rescues', rescueRouter);
// apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/admin', adminRouter);
// apiRouter.use('/analytics', analyticsRouter);

