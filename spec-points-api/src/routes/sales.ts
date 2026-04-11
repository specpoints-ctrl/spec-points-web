import { Router, Request, Response } from 'express';
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

// GET own sales (architect role)
router.get('/my', requireRole(['architect']), asyncHandler(async (req: Request, res: Response) => {
  const uid = (req as any).user?.uid;
  const { db } = await import('../db/config.js');
  const userRole = await db.oneOrNone(
    `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!userRole?.architect_id) return res.json({ success: true, data: [], total: 0 });

  const sales = await db.manyOrNone(
    `SELECT s.*, st.name as store_name FROM sales s
     LEFT JOIN stores st ON st.id = s.store_id
     WHERE s.architect_id = $1
     ORDER BY s.created_at DESC LIMIT 50`,
    [userRole.architect_id]
  );
  return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
}));

router.get('/', requireRole(['admin']), asyncHandler(listSales));
router.get('/:id', requireRole(['admin']), asyncHandler(getSale));
router.post('/', requireRole(['admin']), asyncHandler(createSale));
router.put('/:id', requireRole(['admin']), asyncHandler(updateSale));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteSale));

export default router;
