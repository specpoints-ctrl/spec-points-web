import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - only authenticated users
router.get('/stats', authenticateToken, getDashboardStats);

export default router;
