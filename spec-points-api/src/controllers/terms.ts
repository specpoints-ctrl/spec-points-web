import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getActiveTerms(_req: Request, res: Response) {
  try {
    const terms = await db.oneOrNone(
      `SELECT * FROM terms WHERE active = true ORDER BY created_at DESC LIMIT 1`
    );

    return res.json({ success: true, data: terms || null });
  } catch (error) {
    throw new AppError('Erro ao buscar termos', 400, error);
  }
}

export async function getAllTerms(_req: Request, res: Response) {
  try {
    const terms = await db.manyOrNone(`SELECT * FROM terms ORDER BY created_at DESC`);
    return res.json({ success: true, data: terms || [], total: terms?.length || 0 });
  } catch (error) {
    throw new AppError('Erro ao listar termos', 400, error);
  }
}

export async function createTerms(req: AuthRequest, res: Response) {
  try {
    const { content, version } = req.body;

    if (!content || !version) {
      throw new AppError('Conteúdo e versão são obrigatórios', 400);
    }

    const terms = await db.tx(async (tx) => {
      // Deactivate all existing active terms
      await tx.none(`UPDATE terms SET active = false WHERE active = true`);

      return await tx.one(
        `INSERT INTO terms (content, version, active) VALUES ($1, $2, true) RETURNING *`,
        [content, version]
      );
    });

    return res.status(201).json({ success: true, data: terms, message: 'Termos criados com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar termos', 400, error);
  }
}

export async function updateTerms(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { content, version } = req.body;

    const terms = await db.oneOrNone(
      `UPDATE terms SET
        content = COALESCE($1, content),
        version = COALESCE($2, version)
       WHERE id = $3
       RETURNING *`,
      [content || null, version || null, id]
    );

    if (!terms) throw new AppError('Termos não encontrados', 404);

    return res.json({ success: true, data: terms, message: 'Termos atualizados com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar termos', 400, error);
  }
}

export async function checkAcceptance(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    // Admins never need to accept terms
    const userRole = await db.oneOrNone(
      `SELECT ur.role FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (userRole?.role === 'admin') {
      return res.json({ success: true, data: { accepted: true, terms: null } });
    }

    const activeTerms = await db.oneOrNone(
      `SELECT * FROM terms WHERE active = true ORDER BY created_at DESC LIMIT 1`
    );

    if (!activeTerms) {
      return res.json({ success: true, data: { accepted: true, terms: null } });
    }

    const acceptance = await db.oneOrNone(
      `SELECT uta.id FROM user_terms_acceptance uta
       JOIN users u ON u.id = uta.user_id
       WHERE u.firebase_uid = $1 AND uta.terms_id = $2`,
      [uid, activeTerms.id]
    );

    return res.json({
      success: true,
      data: {
        accepted: !!acceptance,
        terms: acceptance ? null : activeTerms,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao verificar aceite dos termos', 400, error);
  }
}

export async function acceptTerms(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    const { terms_id } = req.body;
    if (!terms_id) throw new AppError('ID dos termos é obrigatório', 400);

    const user = await db.oneOrNone(`SELECT id FROM users WHERE firebase_uid = $1`, [uid]);
    if (!user) throw new AppError('Usuário não encontrado', 404);

    const terms = await db.oneOrNone(`SELECT id FROM terms WHERE id = $1 AND active = true`, [terms_id]);
    if (!terms) throw new AppError('Termos não encontrados ou inativados', 404);

    await db.none(
      `INSERT INTO user_terms_acceptance (user_id, terms_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, terms_id) DO NOTHING`,
      [user.id, terms_id]
    );

    return res.json({ success: true, message: 'Termos aceitos com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao aceitar termos', 400, error);
  }
}
