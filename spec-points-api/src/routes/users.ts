import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listPendingUsers,
  getUserDetails,
  approveUser,
  rejectUser,
  listAllUsers,
} from '../controllers/users.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET pending users
router.get('/pending', asyncHandler(listPendingUsers));

// GET all users (with filters)
router.get('/', asyncHandler(listAllUsers));

// GET user details
router.get('/:userId', asyncHandler(getUserDetails));

// POST approve user
router.post('/:userId/approve', asyncHandler(approveUser));

// POST reject user
router.post('/:userId/reject', asyncHandler(rejectUser));

export default router;
