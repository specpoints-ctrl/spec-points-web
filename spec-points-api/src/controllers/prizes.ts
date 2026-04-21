import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';

interface PrizeData {
  name: string;
  description?: string;
  image_url?: string;
  points_required: number;
  stock: number;
  active?: boolean;
  expires_at?: string | null;
}

export async function listActivePrizes(_req: Request, res: Response) {
  try {
    const prizes = await db.manyOrNone(
      `SELECT id, name, description, image_url, points_required, stock, active
       FROM prizes
       WHERE active = TRUE AND stock > 0 AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY points_required ASC`
    );
    return res.json({ success: true, data: prizes || [] });
  } catch (error) {
    throw new AppError('Erro ao listar premios ativos', 400, error);
  }
}

export async function listPrizes(_req: Request, res: Response) {
  try {
    const prizes = await db.manyOrNone(
      `SELECT
        id,
        name,
        description,
        image_url,
        points_required,
        stock,
        active,
        expires_at,
        created_at,
        updated_at
      FROM prizes
      ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: prizes || [],
      total: prizes?.length || 0,
    });
  } catch (error) {
    throw new AppError('Erro ao listar premios', 400, error);
  }
}

export async function getPrize(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const prize = await db.oneOrNone(
      `SELECT
        id,
        name,
        description,
        image_url,
        points_required,
        stock,
        active,
        expires_at,
        created_at,
        updated_at
      FROM prizes
      WHERE id = $1`,
      [id]
    );

    if (!prize) throw new AppError('Premio nao encontrado', 404);

    return res.json({ success: true, data: prize });
  } catch (error) {
    throw new AppError('Erro ao buscar premio', 400, error);
  }
}

export async function createPrize(req: Request, res: Response) {
  try {
    const { name, description, image_url, points_required, stock, active, expires_at }: PrizeData = req.body;

    if (!name || points_required === undefined || stock === undefined) {
      throw new AppError('Nome, pontos e estoque sao obrigatorios', 400);
    }

    if (Number(points_required) <= 0) {
      throw new AppError('Pontos necessarios devem ser maiores que zero', 400);
    }

    if (Number(stock) < 0) {
      throw new AppError('Estoque nao pode ser negativo', 400);
    }

    const prize = await db.one(
      `INSERT INTO prizes (name, description, image_url, points_required, stock, active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, image_url, points_required, stock, active, expires_at, created_at`,
      [
        name,
        description || null,
        image_url || null,
        points_required,
        stock,
        active ?? true,
        expires_at || null,
      ]
    );

    return res.status(201).json({
      success: true,
      data: prize,
      message: 'Premio criado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao criar premio', 400, error);
  }
}

export async function updatePrize(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, image_url, points_required, stock, active, expires_at } = req.body as Partial<PrizeData>;

    const prize = await db.oneOrNone(
      `UPDATE prizes
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         image_url = COALESCE($3, image_url),
         points_required = COALESCE($4, points_required),
         stock = COALESCE($5, stock),
         active = COALESCE($6, active),
         expires_at = COALESCE($7, expires_at),
         updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, description, image_url, points_required, stock, active, expires_at, created_at, updated_at`,
      [
        name ?? null,
        description ?? null,
        image_url ?? null,
        points_required ?? null,
        stock ?? null,
        active ?? null,
        expires_at ?? null,
        id,
      ]
    );

    if (!prize) throw new AppError('Premio nao encontrado', 404);

    return res.json({
      success: true,
      data: prize,
      message: 'Premio atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar premio', 400, error);
  }
}

export async function deletePrize(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.result('DELETE FROM prizes WHERE id = $1', [id]);

    return res.json({ success: true, message: 'Premio deletado com sucesso' });
  } catch (error) {
    throw new AppError('Erro ao deletar premio', 400, error);
  }
}

export async function togglePrizeActive(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { active } = req.body as { active: boolean };

    if (typeof active !== 'boolean') {
      throw new AppError('Campo active deve ser boolean', 400);
    }

    const prize = await db.oneOrNone(
      `UPDATE prizes
       SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, description, image_url, points_required, stock, active, expires_at, created_at, updated_at`,
      [active, id]
    );

    if (!prize) throw new AppError('Premio nao encontrado', 404);

    return res.json({
      success: true,
      data: prize,
      message: 'Status do premio atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar status do premio', 400, error);
  }
}
