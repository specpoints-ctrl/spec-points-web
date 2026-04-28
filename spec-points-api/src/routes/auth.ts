import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser, googleLogin, completeProfile } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Demasiadas solicitudes desde esta IP. Inténtalo de nuevo más tarde.',
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/google', authenticateToken, googleLogin);
router.post('/complete-profile', authenticateToken, asyncHandler(completeProfile as any));

export default router;
