import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, loadUserContext } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import {
  listArchitects,
  getArchitect,
  createArchitect,
  updateArchitect,
  deleteArchitect,
  updateArchitectStatus,
  listActiveCompleteArchitects,
} from '../controllers/architects.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

// All architect routes require authentication
router.use(authenticateToken);

// GET own architect profile (architect role)
router.get('/me', requireRole(['architect']), asyncHandler(async (req: Request, res: Response) => {
  const user = await loadUserContext(req as AuthRequest);
  if (!user?.architectId) return res.status(404).json({ success: false, error: 'Perfil de arquiteto não encontrado' });

  const { db } = await import('../db/config.js');
  const architect = await db.oneOrNone(`SELECT * FROM architects WHERE id = $1`, [user.architectId]);
  if (!architect) return res.status(404).json({ success: false, error: 'Arquiteto não encontrado' });
  return res.json({ success: true, data: architect });
}));

// GET active architects with complete profile (for sale form dropdown — admin/lojista)
router.get('/active-complete', asyncHandler(listActiveCompleteArchitects));

// GET all architects (admin only)
router.get('/', requireRole(['admin']), asyncHandler(listArchitects));

// GET single architect (admin or the architect themselves)
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await loadUserContext(req as AuthRequest);

    if (!user?.role) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    if (user.role !== 'admin' && String(user.architectId) !== id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    await getArchitect(req, res);
  })
);

// CREATE architect (admin only)
router.post('/', requireRole(['admin']), asyncHandler(createArchitect));

// UPDATE architect (admin only)
router.put('/:id', requireRole(['admin']), asyncHandler(updateArchitect));

// UPDATE architect status (admin only)
router.patch('/:id/status', requireRole(['admin']), asyncHandler(updateArchitectStatus));

// DELETE architect (admin only)
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteArchitect));

export default router;
