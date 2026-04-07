import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
} from '../controllers/sales.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['admin']), asyncHandler(listSales));
router.get('/:id', requireRole(['admin']), asyncHandler(getSale));
router.post('/', requireRole(['admin']), asyncHandler(createSale));
router.put('/:id', requireRole(['admin']), asyncHandler(updateSale));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteSale));

export default router;
