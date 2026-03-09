import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';

interface RedemptionData {
  architect_id: number;
  prize_id: number;
  status?: 'pending' | 'approved' | 'delivered';
}

export async function listRedemptions(_req: Request, res: Response) {
  try {
    const redemptions = await db.manyOrNone(
      `SELECT
        r.id,
        r.architect_id,
        r.prize_id,
        r.status,
        r.created_at,
        r.updated_at,
        a.name as architect_name,
        p.name as prize_name,
        p.points_required
      FROM redemptions r
      LEFT JOIN architects a ON a.id = r.architect_id
      LEFT JOIN prizes p ON p.id = r.prize_id
      ORDER BY r.created_at DESC`
    );

    return res.json({
      success: true,
      data: redemptions || [],
      total: redemptions?.length || 0,
    });
  } catch (error) {
    throw new AppError('Erro ao listar resgates', 400, error);
  }
}

export async function getRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const redemption = await db.oneOrNone(
      `SELECT
        r.id,
        r.architect_id,
        r.prize_id,
        r.status,
        r.created_at,
        r.updated_at,
        a.name as architect_name,
        p.name as prize_name,
        p.points_required
      FROM redemptions r
      LEFT JOIN architects a ON a.id = r.architect_id
      LEFT JOIN prizes p ON p.id = r.prize_id
      WHERE r.id = $1`,
      [id]
    );

    if (!redemption) throw new AppError('Resgate nao encontrado', 404);

    return res.json({ success: true, data: redemption });
  } catch (error) {
    throw new AppError('Erro ao buscar resgate', 400, error);
  }
}

export async function createRedemption(req: Request, res: Response) {
  try {
    const { architect_id, prize_id, status }: RedemptionData = req.body;

    if (!architect_id || !prize_id) {
      throw new AppError('Arquiteto e premio sao obrigatorios', 400);
    }

    const architect = await db.oneOrNone('SELECT id FROM architects WHERE id = $1', [architect_id]);
    if (!architect) throw new AppError('Arquiteto nao encontrado', 404);

    const prize = await db.oneOrNone('SELECT id FROM prizes WHERE id = $1', [prize_id]);
    if (!prize) throw new AppError('Premio nao encontrado', 404);

    const redemption = await db.one(
      `INSERT INTO redemptions (architect_id, prize_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, architect_id, prize_id, status, created_at, updated_at`,
      [architect_id, prize_id, status || 'pending']
    );

    return res.status(201).json({
      success: true,
      data: redemption,
      message: 'Resgate criado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao criar resgate', 400, error);
  }
}

export async function updateRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { architect_id, prize_id, status } = req.body as Partial<RedemptionData>;

    const redemption = await db.oneOrNone(
      `UPDATE redemptions
       SET
         architect_id = COALESCE($1, architect_id),
         prize_id = COALESCE($2, prize_id),
         status = COALESCE($3, status),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, architect_id, prize_id, status, created_at, updated_at`,
      [architect_id ?? null, prize_id ?? null, status ?? null, id]
    );

    if (!redemption) throw new AppError('Resgate nao encontrado', 404);

    return res.json({
      success: true,
      data: redemption,
      message: 'Resgate atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar resgate', 400, error);
  }
}

export async function updateRedemptionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'pending' | 'approved' | 'delivered' };

    if (!['pending', 'approved', 'delivered'].includes(status)) {
      throw new AppError('Status invalido', 400);
    }

    const redemption = await db.oneOrNone(
      `UPDATE redemptions
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, architect_id, prize_id, status, created_at, updated_at`,
      [status, id]
    );

    if (!redemption) throw new AppError('Resgate nao encontrado', 404);

    return res.json({
      success: true,
      data: redemption,
      message: 'Status do resgate atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar status do resgate', 400, error);
  }
}

export async function deleteRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.result('DELETE FROM redemptions WHERE id = $1', [id]);

    return res.json({ success: true, message: 'Resgate deletado com sucesso' });
  } catch (error) {
    throw new AppError('Erro ao deletar resgate', 400, error);
  }
}
