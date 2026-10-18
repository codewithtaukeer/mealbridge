import { Router } from 'express';

export const apiRouter = Router();

// Health
apiRouter.get('/', (_req, res) => {
  res.json({
    service: 'MealBridge API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// Route modules will be added in subsequent phases:
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/organizations', organizationRouter);
// apiRouter.use('/donations', donationRouter);
// apiRouter.use('/rescues', rescueRouter);
// apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/admin', adminRouter);
// apiRouter.use('/analytics', analyticsRouter);
