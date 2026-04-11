import { Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

// GET /api/profile — perfil completo do usuário logado
export async function getProfile(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const user = await db.oneOrNone(
    `SELECT u.id, u.firebase_uid, u.email, u.display_name, u.avatar_url, u.status, u.created_at,
            ur.role, ur.architect_id, ur.store_id
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     WHERE u.firebase_uid = $1`,
    [uid]
  );

  if (!user) throw new AppError('Usuário não encontrado', 404);

  return res.json({ success: true, data: user });
}

// PUT /api/profile — atualiza display_name e/ou avatar_url
export async function updateProfile(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const { display_name, avatar_url } = req.body as {
    display_name?: string;
    avatar_url?: string;
  };

  if (!display_name && !avatar_url) {
    throw new AppError('Nenhum campo para atualizar', 400);
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (display_name !== undefined) {
    updates.push(`display_name = $${idx++}`);
    values.push(display_name.trim().slice(0, 255));
  }
  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${idx++}`);
    values.push(avatar_url.slice(0, 500));
  }

  updates.push(`updated_at = NOW()`);
  values.push(uid);

  const user = await db.oneOrNone(
    `UPDATE users SET ${updates.join(', ')} WHERE firebase_uid = $${idx} RETURNING id, email, display_name, avatar_url`,
    values
  );

  if (!user) throw new AppError('Usuário não encontrado', 404);

  return res.json({ success: true, data: user });
}

// PUT /api/profile/email — syncs new email to DB after Firebase email change
export async function updateEmail(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Não autenticado', 401);

  const { email } = req.body as { email?: string };
  if (!email || !email.includes('@')) throw new AppError('Email inválido', 400);

  const user = await db.oneOrNone(
    `UPDATE users SET email = $1, updated_at = NOW() WHERE firebase_uid = $2
     RETURNING id, email, display_name`,
    [email.trim().toLowerCase(), uid]
  );

  if (!user) throw new AppError('Usuário não encontrado', 404);

  // Also update architect email if applicable
  await db.none(
    `UPDATE architects SET email = $1, updated_at = NOW()
     WHERE id = (
       SELECT architect_id FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       WHERE u.firebase_uid = $2
       LIMIT 1
     )`,
    [email.trim().toLowerCase(), uid]
  );

  return res.json({ success: true, data: user, message: 'Email atualizado com sucesso' });
}
