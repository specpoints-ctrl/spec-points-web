import { Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

// GET /api/notifications — lista notificações para o role do usuário logado
export async function listNotifications(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const user = await db.oneOrNone(
    `SELECT u.id, ur.role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.firebase_uid = $1`,
    [uid]
  );

  if (!user) throw new AppError('Usuário não encontrado', 404);

  const notifications = await db.manyOrNone(
    `SELECT n.id, n.title, n.message, n.type, n.target_role, n.created_at,
            CASE WHEN nr.id IS NOT NULL THEN true ELSE false END AS is_read
     FROM notifications n
     LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
     WHERE n.target_role = 'all' OR n.target_role = $2
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [user.id, user.role]
  );

  return res.json({ success: true, data: notifications || [] });
}

// GET /api/notifications/unread-count
export async function getUnreadCount(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const user = await db.oneOrNone(
    `SELECT u.id, ur.role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.firebase_uid = $1`,
    [uid]
  );

  if (!user) return res.json({ success: true, data: { count: 0 } });

  const result = await db.one(
    `SELECT COUNT(*) AS count
     FROM notifications n
     WHERE (n.target_role = 'all' OR n.target_role = $2)
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads nr
         WHERE nr.notification_id = n.id AND nr.user_id = $1
       )`,
    [user.id, user.role]
  );

  return res.json({ success: true, data: { count: parseInt(result.count) } });
}

// POST /api/notifications — admin cria notificação
export async function createNotification(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const { title, message, type = 'general', target_role } = req.body as {
    title: string;
    message: string;
    type?: string;
    target_role: string;
  };

  if (!title || !message || !target_role) {
    throw new AppError('título, mensagem e público-alvo são obrigatórios', 400);
  }

  const validTypes = ['general', 'offer', 'campaign'];
  const validTargets = ['architect', 'lojista', 'all'];

  if (!validTypes.includes(type)) throw new AppError('Tipo inválido', 400);
  if (!validTargets.includes(target_role)) throw new AppError('Público-alvo inválido', 400);

  const creator = await db.oneOrNone(`SELECT id FROM users WHERE firebase_uid = $1`, [uid]);

  const notification = await db.one(
    `INSERT INTO notifications (title, message, type, target_role, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title.trim(), message.trim(), type, target_role, creator?.id ?? null]
  );

  return res.status(201).json({ success: true, data: notification });
}

// PATCH /api/notifications/:id/read — marca como lida para o usuário atual
export async function markAsRead(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const { id } = req.params;

  const user = await db.oneOrNone(`SELECT id FROM users WHERE firebase_uid = $1`, [uid]);
  if (!user) throw new AppError('Usuário não encontrado', 404);

  await db.none(
    `INSERT INTO notification_reads (notification_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (notification_id, user_id) DO NOTHING`,
    [id, user.id]
  );

  return res.json({ success: true });
}

// PATCH /api/notifications/read-all — marca todas como lidas
export async function markAllAsRead(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const user = await db.oneOrNone(
    `SELECT u.id, ur.role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!user) throw new AppError('Usuário não encontrado', 404);

  await db.none(
    `INSERT INTO notification_reads (notification_id, user_id)
     SELECT n.id, $1 FROM notifications n
     WHERE (n.target_role = 'all' OR n.target_role = $2)
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = $1
       )`,
    [user.id, user.role]
  );

  return res.json({ success: true });
}

// DELETE /api/notifications/:id — admin deleta notificação
export async function deleteNotification(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const notification = await db.oneOrNone(`SELECT id FROM notifications WHERE id = $1`, [id]);
  if (!notification) throw new AppError('Notificação não encontrada', 404);

  await db.none(`DELETE FROM notifications WHERE id = $1`, [id]);

  return res.json({ success: true });
}

// GET /api/notifications/admin — admin lista todas as notificações enviadas
export async function listAllNotifications(_req: AuthRequest, res: Response) {
  const notifications = await db.manyOrNone(
    `SELECT n.*, u.email as creator_email, u.display_name as creator_name
     FROM notifications n
     LEFT JOIN users u ON u.id = n.created_by
     ORDER BY n.created_at DESC`
  );

  return res.json({ success: true, data: notifications || [] });
}
