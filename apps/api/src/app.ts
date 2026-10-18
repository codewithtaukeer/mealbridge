import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { apiRouter } from './routes';

export const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root index
app.get('/', (_req, res) => {
  res.json({
    service: 'MealBridge Coordination API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/health',
    realtime: 'Socket.IO active on /socket.io'
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mealbridge-api', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
