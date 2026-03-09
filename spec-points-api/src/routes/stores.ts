import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role-check';
import { asyncHandler } from '../middleware/async-handler';
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  updateStoreStatus,
} from '../controllers/stores.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['admin']), asyncHandler(listStores));
router.get('/:id', requireRole(['admin']), asyncHandler(getStore));
router.post('/', requireRole(['admin']), asyncHandler(createStore));
router.put('/:id', requireRole(['admin']), asyncHandler(updateStore));
router.patch('/:id/status', requireRole(['admin']), asyncHandler(updateStoreStatus));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteStore));

export default router;
