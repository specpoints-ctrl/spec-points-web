import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listActivePrizes,
  listPrizes,
  getPrize,
  createPrize,
  updatePrize,
  deletePrize,
  togglePrizeActive,
} from '../controllers/prizes.js';

const router = Router();

router.use(authenticateToken);

router.get('/active', requireRole(['admin', 'architect', 'lojista']), asyncHandler(listActivePrizes));
router.get('/', requireRole(['admin']), asyncHandler(listPrizes));
router.get('/:id', requireRole(['admin']), asyncHandler(getPrize));
router.post('/', requireRole(['admin']), asyncHandler(createPrize));
router.put('/:id', requireRole(['admin']), asyncHandler(updatePrize));
router.patch('/:id/active', requireRole(['admin']), asyncHandler(togglePrizeActive));
router.delete('/:id', requireRole(['admin']), asyncHandler(deletePrize));

export default router;
