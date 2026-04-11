import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  getActiveTerms,
  getAllTerms,
  createTerms,
  updateTerms,
  checkAcceptance,
  acceptTerms,
} from '../controllers/terms.js';

const router = Router();

// Public — anyone can read active terms
router.get('/active', asyncHandler(getActiveTerms));

// Authenticated
router.get('/check', authenticateToken, asyncHandler(checkAcceptance as any));
router.post('/accept', authenticateToken, asyncHandler(acceptTerms as any));

// Admin only
router.get('/', authenticateToken, requireRole(['admin']), asyncHandler(getAllTerms));
router.post('/', authenticateToken, requireRole(['admin']), asyncHandler(createTerms as any));
router.put('/:id', authenticateToken, requireRole(['admin']), asyncHandler(updateTerms));

export default router;
