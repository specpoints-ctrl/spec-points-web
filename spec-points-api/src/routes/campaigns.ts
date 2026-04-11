import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignRanking,
  getActiveCampaigns,
  getMyActiveCampaigns,
} from '../controllers/campaigns.js';

const router = Router();

router.use(authenticateToken);

// Accessible to authenticated users (architect/lojista/admin)
router.get('/active', asyncHandler(getActiveCampaigns));

// Architect only
router.get('/my', requireRole(['architect']), asyncHandler(getMyActiveCampaigns as any));

// Admin only
router.get('/', requireRole(['admin']), asyncHandler(listCampaigns));
router.get('/:id/ranking', requireRole(['admin']), asyncHandler(getCampaignRanking));
router.get('/:id', requireRole(['admin']), asyncHandler(getCampaign));
router.post('/', requireRole(['admin']), asyncHandler(createCampaign as any));
router.put('/:id', requireRole(['admin']), asyncHandler(updateCampaign));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteCampaign));

export default router;
