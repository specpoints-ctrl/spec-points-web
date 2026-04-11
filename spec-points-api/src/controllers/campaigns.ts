import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';
import { AuthRequest } from '../middleware/auth.js';

interface CampaignPrize {
  name: string;
  points_required: number;
  stock: number;
  image_url?: string;
}

interface CampaignData {
  title: string;
  subtitle?: string;
  focus: 'all' | 'architect' | 'lojista';
  points_multiplier: number;
  start_date: string;
  end_date: string;
  active?: boolean;
  prizes?: CampaignPrize[];
}

export async function listCampaigns(_req: Request, res: Response) {
  try {
    const campaigns = await db.manyOrNone(
      `SELECT
        c.*,
        COUNT(DISTINCT cp.id) as prize_count,
        COUNT(DISTINCT cs.id) as sale_count
       FROM campaigns c
       LEFT JOIN campaign_prizes cp ON cp.campaign_id = c.id
       LEFT JOIN campaign_sales cs ON cs.campaign_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    return res.json({ success: true, data: campaigns || [], total: campaigns?.length || 0 });
  } catch (error) {
    throw new AppError('Erro ao listar campanhas', 400, error);
  }
}

export async function getCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const campaign = await db.oneOrNone(
      `SELECT c.*,
        COUNT(DISTINCT cp.id) as prize_count,
        COUNT(DISTINCT cs.id) as sale_count
       FROM campaigns c
       LEFT JOIN campaign_prizes cp ON cp.campaign_id = c.id
       LEFT JOIN campaign_sales cs ON cs.campaign_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (!campaign) throw new AppError('Campanha não encontrada', 404);

    const prizes = await db.manyOrNone(
      `SELECT * FROM campaign_prizes WHERE campaign_id = $1 ORDER BY id`,
      [id]
    );

    return res.json({ success: true, data: { ...campaign, prizes: prizes || [] } });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar campanha', 400, error);
  }
}

export async function createCampaign(req: AuthRequest, res: Response) {
  try {
    const {
      title, subtitle, focus = 'all', points_multiplier = 1.0,
      start_date, end_date, active = true, prizes = [],
    }: CampaignData = req.body;

    if (!title || !start_date || !end_date) {
      throw new AppError('Título, data de início e data de fim são obrigatórios', 400);
    }

    if (Number(points_multiplier) <= 0) {
      throw new AppError('Multiplicador de pontos deve ser maior que zero', 400);
    }

    if (new Date(end_date) < new Date(start_date)) {
      throw new AppError('Data de fim deve ser posterior à data de início', 400);
    }

    const uid = req.user?.uid;
    const creatorUser = uid
      ? await db.oneOrNone('SELECT id FROM users WHERE firebase_uid = $1', [uid])
      : null;

    const campaign = await db.tx(async (tx) => {
      const newCampaign = await tx.one(
        `INSERT INTO campaigns (title, subtitle, focus, points_multiplier, start_date, end_date, active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, subtitle || null, focus, points_multiplier, start_date, end_date, active, creatorUser?.id || null]
      );

      if (prizes.length > 0) {
        for (const prize of prizes) {
          if (!prize.name || !prize.points_required) continue;
          await tx.none(
            `INSERT INTO campaign_prizes (campaign_id, name, points_required, stock, image_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [newCampaign.id, prize.name, prize.points_required, prize.stock || 0, prize.image_url || null]
          );
        }
      }

      const insertedPrizes = await tx.manyOrNone(
        `SELECT * FROM campaign_prizes WHERE campaign_id = $1 ORDER BY id`,
        [newCampaign.id]
      );

      return { ...newCampaign, prizes: insertedPrizes || [] };
    });

    return res.status(201).json({ success: true, data: campaign, message: 'Campanha criada com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar campanha', 400, error);
  }
}

export async function updateCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title, subtitle, focus, points_multiplier, start_date, end_date, active, prizes,
    } = req.body as Partial<CampaignData>;

    const campaign = await db.tx(async (tx) => {
      const updated = await tx.oneOrNone(
        `UPDATE campaigns SET
          title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          focus = COALESCE($3, focus),
          points_multiplier = COALESCE($4, points_multiplier),
          start_date = COALESCE($5, start_date),
          end_date = COALESCE($6, end_date),
          active = COALESCE($7, active),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *`,
        [
          title ?? null, subtitle ?? null, focus ?? null,
          points_multiplier ?? null, start_date ?? null, end_date ?? null,
          active ?? null, id,
        ]
      );

      if (!updated) throw new AppError('Campanha não encontrada', 404);

      // If prizes array is provided, replace all prizes
      if (prizes !== undefined) {
        await tx.none('DELETE FROM campaign_prizes WHERE campaign_id = $1', [id]);
        for (const prize of prizes) {
          if (!prize.name || !prize.points_required) continue;
          await tx.none(
            `INSERT INTO campaign_prizes (campaign_id, name, points_required, stock, image_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, prize.name, prize.points_required, prize.stock || 0, prize.image_url || null]
          );
        }
      }

      const updatedPrizes = await tx.manyOrNone(
        `SELECT * FROM campaign_prizes WHERE campaign_id = $1 ORDER BY id`,
        [id]
      );

      return { ...updated, prizes: updatedPrizes || [] };
    });

    return res.json({ success: true, data: campaign, message: 'Campanha atualizada com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar campanha', 400, error);
  }
}

export async function deleteCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await db.result('DELETE FROM campaigns WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Campanha deletada com sucesso' });
  } catch (error) {
    throw new AppError('Erro ao deletar campanha', 400, error);
  }
}

export async function getCampaignRanking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const campaign = await db.oneOrNone('SELECT id, title FROM campaigns WHERE id = $1', [id]);
    if (!campaign) throw new AppError('Campanha não encontrada', 404);

    const ranking = await db.manyOrNone(
      `SELECT
        a.id as architect_id,
        a.name as architect_name,
        COALESCE(SUM(cs.points_earned), 0) as campaign_points
       FROM campaign_sales cs
       JOIN sales s ON s.id = cs.sale_id
       JOIN architects a ON a.id = s.architect_id
       WHERE cs.campaign_id = $1
       GROUP BY a.id, a.name
       ORDER BY campaign_points DESC`,
      [id]
    );

    return res.json({ success: true, data: { campaign, ranking: ranking || [] } });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar ranking da campanha', 400, error);
  }
}

export async function getActiveCampaigns(_req: Request, res: Response) {
  try {
    const campaigns = await db.manyOrNone(
      `SELECT c.*, ARRAY_AGG(
        JSON_BUILD_OBJECT('id', cp.id, 'name', cp.name, 'points_required', cp.points_required, 'stock', cp.stock, 'image_url', cp.image_url)
        ORDER BY cp.id
       ) FILTER (WHERE cp.id IS NOT NULL) as prizes
       FROM campaigns c
       LEFT JOIN campaign_prizes cp ON cp.campaign_id = c.id
       WHERE c.active = true AND c.start_date <= CURRENT_DATE AND c.end_date >= CURRENT_DATE
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    return res.json({ success: true, data: campaigns || [] });
  } catch (error) {
    throw new AppError('Erro ao buscar campanhas ativas', 400, error);
  }
}

export async function getMyActiveCampaigns(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    const userRole = await db.oneOrNone(
      `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (!userRole?.architect_id) throw new AppError('Perfil de arquiteto não encontrado', 404);

    const campaigns = await db.manyOrNone(
      `SELECT
        c.id, c.title, c.subtitle, c.focus, c.points_multiplier,
        c.start_date, c.end_date, c.active,
        COALESCE(SUM(cs.points_earned), 0) as points_earned
       FROM campaigns c
       LEFT JOIN campaign_sales cs ON cs.campaign_id = c.id
       LEFT JOIN sales s ON s.id = cs.sale_id AND s.architect_id = $1
       WHERE c.active = true AND c.start_date <= CURRENT_DATE AND c.end_date >= CURRENT_DATE
         AND (c.focus = 'all' OR c.focus = 'architect')
       GROUP BY c.id
       ORDER BY c.start_date DESC`,
      [userRole.architect_id]
    );

    return res.json({ success: true, data: campaigns || [] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar minhas campanhas', 400, error);
  }
}
