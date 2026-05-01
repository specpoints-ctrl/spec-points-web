import { Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

const INSTAGRAM_HANDLE_REGEX = /^[A-Za-z0-9._]{1,30}$/;

const normalizeInstagramHandle = (raw?: string | null): string | null => {
  if (raw === undefined || raw === null) return null;

  let candidate = String(raw).trim();
  if (!candidate) return null;

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (hostname !== 'instagram.com') return null;

      const firstPathSegment = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
      candidate = firstPathSegment;
    } catch {
      return null;
    }
  }

  candidate = candidate.replace(/^@+/, '').trim();
  if (!candidate) return null;

  if (!INSTAGRAM_HANDLE_REGEX.test(candidate)) return null;
  return candidate;
};

// GET /api/profile - full profile from authenticated user
export async function getProfile(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Nao autenticado', 401);

  const user = await db.oneOrNone(
    `SELECT u.id, u.firebase_uid, u.email, u.display_name, u.avatar_url, u.instagram_handle, u.status, u.created_at,
            ur.role, ur.architect_id, ur.store_id
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     WHERE u.firebase_uid = $1`,
    [uid]
  );

  if (!user) throw new AppError('Usuario nao encontrado', 404);

  return res.json({ success: true, data: user });
}

// PUT /api/profile - updates display_name, avatar_url and/or instagram_handle
export async function updateProfile(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Nao autenticado', 401);

  const { display_name, avatar_url, instagram_handle } = req.body as {
    display_name?: string;
    avatar_url?: string;
    instagram_handle?: string | null;
  };

  if (display_name === undefined && avatar_url === undefined && instagram_handle === undefined) {
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

  if (instagram_handle !== undefined) {
    const normalizedInstagram = normalizeInstagramHandle(instagram_handle);
    if (instagram_handle && !normalizedInstagram) {
      throw new AppError('Instagram invalido. Use @usuario ou URL do Instagram.', 400);
    }

    updates.push(`instagram_handle = $${idx++}`);
    values.push(normalizedInstagram);
  }

  updates.push('updated_at = NOW()');
  values.push(uid);

  const user = await db.oneOrNone(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE firebase_uid = $${idx}
     RETURNING id, email, display_name, avatar_url, instagram_handle`,
    values
  );

  if (!user) throw new AppError('Usuario nao encontrado', 404);

  return res.json({ success: true, data: user });
}

// PUT /api/profile/email - syncs new email to DB after Firebase email change
export async function updateEmail(req: AuthRequest, res: Response) {
  const uid = req.user?.uid;
  if (!uid) throw new AppError('Nao autenticado', 401);

  const { email } = req.body as { email?: string };
  if (!email || !email.includes('@')) throw new AppError('Email invalido', 400);

  const user = await db.oneOrNone(
    `UPDATE users SET email = $1, updated_at = NOW() WHERE firebase_uid = $2
     RETURNING id, email, display_name, instagram_handle`,
    [email.trim().toLowerCase(), uid]
  );

  if (!user) throw new AppError('Usuario nao encontrado', 404);

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
