import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  listAllNotifications,
} from '../controllers/notifications.js';

const router = Router();

router.use(authenticateToken);

// Routes accessible by all authenticated users
router.get('/', asyncHandler(listNotifications as any));
router.get('/unread-count', asyncHandler(getUnreadCount as any));
router.patch('/read-all', asyncHandler(markAllAsRead as any));
router.patch('/:id/read', asyncHandler(markAsRead as any));

// Admin-only routes
router.get('/admin', requireRole(['admin']), asyncHandler(listAllNotifications as any));
router.post('/', requireRole(['admin']), asyncHandler(createNotification as any));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteNotification as any));

export default router;
