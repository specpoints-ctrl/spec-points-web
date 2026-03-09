import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role-check';
import { asyncHandler } from '../middleware/async-handler';
import {
  listRedemptions,
  getRedemption,
  createRedemption,
  updateRedemption,
  updateRedemptionStatus,
  deleteRedemption,
} from '../controllers/redemptions.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['admin']), asyncHandler(listRedemptions));
router.get('/:id', requireRole(['admin']), asyncHandler(getRedemption));
router.post('/', requireRole(['admin']), asyncHandler(createRedemption));
router.put('/:id', requireRole(['admin']), asyncHandler(updateRedemption));
router.patch('/:id/status', requireRole(['admin']), asyncHandler(updateRedemptionStatus));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteRedemption));

export default router;
