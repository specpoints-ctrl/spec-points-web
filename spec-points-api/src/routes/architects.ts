import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role-check';
import {
  listArchitects,
  getArchitect,
  createArchitect,
  updateArchitect,
  deleteArchitect,
  updateArchitectStatus,
} from '../controllers/architects';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// All architect routes require authentication
router.use(authenticateToken);

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
