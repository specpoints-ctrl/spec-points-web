import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

interface RedemptionData {
  architect_id: number;
  prize_id: number;
  status?: 'pending' | 'approved' | 'delivered';
}

const REDEMPTION_SELECT = `
  SELECT
    r.id,
    r.architect_id,
    r.prize_id,
    r.status,
    r.deadline_at,
    r.delivered_at,
    r.created_at,
    r.updated_at,
    a.name as architect_name,
    p.name as prize_name,
    p.points_required,
    p.image_url as prize_image
  FROM redemptions r
  LEFT JOIN architects a ON a.id = r.architect_id
  LEFT JOIN prizes p ON p.id = r.prize_id
`;

export async function listRedemptions(_req: Request, res: Response) {
  try {
    const redemptions = await db.manyOrNone(
      `${REDEMPTION_SELECT} ORDER BY r.created_at DESC`
    );

    return res.json({ success: true, data: redemptions || [], total: redemptions?.length || 0 });
  } catch (error) {
    throw new AppError('Erro ao listar resgates', 400, error);
  }
}

export async function getRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const redemption = await db.oneOrNone(
      `${REDEMPTION_SELECT} WHERE r.id = $1`,
      [id]
    );

    if (!redemption) throw new AppError('Resgate não encontrado', 404);

    return res.json({ success: true, data: redemption });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar resgate', 400, error);
  }
}

// Admin: create redemption manually
export async function createRedemption(req: Request, res: Response) {
  try {
    const { architect_id, prize_id, status }: RedemptionData = req.body;

    if (!architect_id || !prize_id) {
      throw new AppError('Arquiteto e prêmio são obrigatórios', 400);
    }

    const architect = await db.oneOrNone('SELECT id FROM architects WHERE id = $1', [architect_id]);
    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    const prize = await db.oneOrNone('SELECT id FROM prizes WHERE id = $1', [prize_id]);
    if (!prize) throw new AppError('Prêmio não encontrado', 404);

    const redemption = await db.one(
      `INSERT INTO redemptions (architect_id, prize_id, status, deadline_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
       RETURNING *`,
      [architect_id, prize_id, status || 'pending']
    );

    return res.status(201).json({
      success: true,
      data: redemption,
      message: 'Resgate criado com sucesso',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar resgate', 400, error);
  }
}

// Architect: request their own redemption
export async function requestRedemption(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    const { prize_id } = req.body;
    if (!prize_id) throw new AppError('Prêmio é obrigatório', 400);

    const userRole = await db.oneOrNone(
      `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (!userRole?.architect_id) throw new AppError('Perfil de arquiteto não encontrado', 404);

    const architect = await db.oneOrNone(
      `SELECT id, points_total, points_redeemed FROM architects WHERE id = $1`,
      [userRole.architect_id]
    );
    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    const prize = await db.oneOrNone(
      `SELECT id, name, points_required, stock, active FROM prizes WHERE id = $1`,
      [prize_id]
    );
    if (!prize) throw new AppError('Prêmio não encontrado', 404);
    if (!prize.active) throw new AppError('Prêmio não está disponível', 400);
    if (Number(prize.stock) <= 0) throw new AppError('Prêmio sem estoque', 400);

    const availablePoints = Number(architect.points_total) - Number(architect.points_redeemed);
    if (availablePoints < Number(prize.points_required)) {
      throw new AppError(
        `Pontos insuficientes. Você tem ${availablePoints} pontos disponíveis e precisa de ${prize.points_required}`,
        400
      );
    }

    const redemption = await db.one(
      `INSERT INTO redemptions (architect_id, prize_id, status, deadline_at)
       VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 days')
       RETURNING *`,
      [userRole.architect_id, prize_id]
    );

    return res.status(201).json({
      success: true,
      data: redemption,
      message: 'Solicitação de resgate enviada com sucesso',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao solicitar resgate', 400, error);
  }
}

// Architect: get their own redemptions
export async function getMyRedemptions(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    const userRole = await db.oneOrNone(
      `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (!userRole?.architect_id) throw new AppError('Perfil de arquiteto não encontrado', 404);

    const redemptions = await db.manyOrNone(
      `${REDEMPTION_SELECT}
       WHERE r.architect_id = $1
       ORDER BY r.created_at DESC`,
      [userRole.architect_id]
    );

    return res.json({ success: true, data: redemptions || [] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar meus resgates', 400, error);
  }
}

// Admin: approve a redemption (pending → approved), deducts points
export async function approveRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const redemption = await db.oneOrNone(
      `${REDEMPTION_SELECT} WHERE r.id = $1`,
      [id]
    );

    if (!redemption) throw new AppError('Resgate não encontrado', 404);
    if (redemption.status !== 'pending') {
      throw new AppError(`Resgate não pode ser aprovado — status atual: ${redemption.status}`, 400);
    }

    const architect = await db.oneOrNone(
      `SELECT id, points_total, points_redeemed FROM architects WHERE id = $1`,
      [redemption.architect_id]
    );

    const availablePoints = Number(architect.points_total) - Number(architect.points_redeemed);
    if (availablePoints < Number(redemption.points_required)) {
      throw new AppError('Arquiteto não tem pontos suficientes para este resgate', 400);
    }

    const updated = await db.tx(async (tx) => {
      const result = await tx.one(
        `UPDATE redemptions SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );

      await tx.none(
        `UPDATE architects SET points_redeemed = points_redeemed + $1 WHERE id = $2`,
        [redemption.points_required, redemption.architect_id]
      );

      await tx.none(
        `UPDATE prizes SET stock = stock - 1 WHERE id = $1 AND stock > 0`,
        [redemption.prize_id]
      );

      return result;
    });

    return res.json({ success: true, data: updated, message: 'Resgate aprovado com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao aprovar resgate', 400, error);
  }
}

// Admin: mark redemption as delivered
export async function deliverRedemption(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await db.oneOrNone('SELECT id, status FROM redemptions WHERE id = $1', [id]);
    if (!existing) throw new AppError('Resgate não encontrado', 404);
    if (existing.status !== 'approved') {
      throw new AppError(`Resgate não pode ser marcado como entregue — status atual: ${existing.status}`, 400);
    }

    const redemption = await db.one(
      `UPDATE redemptions SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return res.json({ success: true, data: redemption, message: 'Entrega registrada com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao registrar entrega', 400, error);
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
       RETURNING *`,
      [architect_id ?? null, prize_id ?? null, status ?? null, id]
    );

    if (!redemption) throw new AppError('Resgate não encontrado', 404);

    return res.json({ success: true, data: redemption, message: 'Resgate atualizado com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar resgate', 400, error);
  }
}

export async function updateRedemptionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'pending' | 'approved' | 'delivered' };

    if (!['pending', 'approved', 'delivered'].includes(status)) {
      throw new AppError('Status inválido', 400);
    }

    const redemption = await db.oneOrNone(
      `UPDATE redemptions SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, architect_id, prize_id, status, created_at, updated_at`,
      [status, id]
    );

    if (!redemption) throw new AppError('Resgate não encontrado', 404);

    return res.json({ success: true, data: redemption, message: 'Status atualizado com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar status', 400, error);
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
