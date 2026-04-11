import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
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
  const uid = (req as any).user?.uid;
  const userRole = await (await import('../db/config.js')).db.oneOrNone(
    `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!userRole?.architect_id) return res.status(404).json({ success: false, error: 'Perfil de arquiteto não encontrado' });

  const { db } = await import('../db/config.js');
  const architect = await db.oneOrNone(`SELECT * FROM architects WHERE id = $1`, [userRole.architect_id]);
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
    const user = (req as any).user;
    const { id } = req.params;

    // Check if user is admin or the architect themselves
    if (user.role !== 'admin' && user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
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
