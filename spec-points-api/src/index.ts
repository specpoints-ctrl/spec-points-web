import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Initialize Express app
export const app: Express = express();

// Trust Railway/Heroku reverse proxy so rate limiter uses the real client IP
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
        .split(',')
        .map((o) => o.trim());
      // Permite requests sem origin (ex: mobile, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global rate limiter removed — authenticated routes are protected by JWT.
// Auth-specific rate limiting (login/register brute-force) lives in routes/auth.ts.

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      configured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
      projectId: process.env.FIREBASE_PROJECT_ID ? '✓ set' : '✗ missing',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✓ set' : '✗ missing',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? `✓ set (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : '✗ missing',
    },
    database: {
      configured: !!process.env.DATABASE_URL,
      url: process.env.DATABASE_URL ? '✓ set' : '✗ missing',
    },
  });
});

// Debug endpoint (development only)
app.get('/debug/env', (_req: Request, res: Response) => {
  const envVars = Object.keys(process.env)
    .filter(key => 
      key.startsWith('FIREBASE_') || 
      key.startsWith('DATABASE_') ||
      key.startsWith('NODE_') ||
      key.startsWith('API_') ||
      key.startsWith('PORT') ||
      key.startsWith('CORS_') ||
      key.startsWith('JWT_') ||
      key.startsWith('LOG_')
    )
    .reduce((acc, key) => {
      // Mask sensitive values
      if (key.includes('SECRET') || key.includes('PRIVATE_KEY') || key.includes('DATABASE_URL')) {
        acc[key] = process.env[key] 
          ? `${process.env[key].substring(0, 20)}...(${process.env[key].length} chars total)` 
          : '(not set)';
      } else {
        acc[key] = process.env[key] || '(not set)';
      }
      return acc;
    }, {} as Record<string, string>);

  res.json({
    message: 'Environment variables (sensitive values masked)',
    env: envVars,
    totalEnvVars: Object.keys(process.env).length,
  });
});

// Import routes
import authRoutes from './routes/auth.js';
import architectRoutes from './routes/architects.js';
import storeRoutes from './routes/stores.js';
import saleRoutes from './routes/sales.js';
import prizeRoutes from './routes/prizes.js';
import redemptionRoutes from './routes/redemptions.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';
import uploadRoutes from './routes/upload.js';
import campaignRoutes from './routes/campaigns.js';
import termsRoutes from './routes/terms.js';

// API Routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'SpecPoints API v1.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      architects: '/api/architects',
      stores: '/api/stores',
      sales: '/api/sales',
      prizes: '/api/prizes',
      redemptions: '/api/redemptions',
      users: '/api/users',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications',
      profile: '/api/profile',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/architects', architectRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/terms', termsRoutes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

export { logger };
