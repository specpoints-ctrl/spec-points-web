import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listRedemptions,
  getRedemption,
  createRedemption,
  updateRedemption,
  updateRedemptionStatus,
  deleteRedemption,
  requestRedemption,
  getMyRedemptions,
  approveRedemption,
  deliverRedemption,
} from '../controllers/redemptions.js';

const router = Router();

router.use(authenticateToken);

// Architect routes
router.post('/request', requireRole(['architect']), asyncHandler(requestRedemption as any));
router.get('/my', requireRole(['architect']), asyncHandler(getMyRedemptions as any));

// Admin routes
router.get('/', requireRole(['admin']), asyncHandler(listRedemptions));
router.get('/:id', requireRole(['admin']), asyncHandler(getRedemption));
router.post('/', requireRole(['admin']), asyncHandler(createRedemption));
router.put('/:id', requireRole(['admin']), asyncHandler(updateRedemption));
router.patch('/:id/status', requireRole(['admin']), asyncHandler(updateRedemptionStatus));
router.patch('/:id/approve', requireRole(['admin']), asyncHandler(approveRedemption));
router.patch('/:id/deliver', requireRole(['admin']), asyncHandler(deliverRedemption));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteRedemption));

export default router;
