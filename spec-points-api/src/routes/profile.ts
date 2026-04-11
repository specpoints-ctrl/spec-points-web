import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { getProfile, updateProfile, updateEmail } from '../controllers/profile.js';

const router = Router();

router.use(authenticateToken);

router.get('/', asyncHandler(getProfile as any));
router.put('/', asyncHandler(updateProfile as any));
router.put('/email', asyncHandler(updateEmail as any));

export default router;
