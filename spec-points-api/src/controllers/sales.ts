import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';

interface SaleData {
  architect_id: number;
  store_id: number;
  client_name?: string;
  client_phone?: string;
  amount_usd: number;
  description?: string;
  product_name?: string;
  quantity?: number;
}

export async function listSales(_req: Request, res: Response) {
  try {
    const sales = await db.manyOrNone(
      `SELECT
        s.id,
        s.architect_id,
        s.store_id,
        s.client_name,
        s.client_phone,
        s.amount_usd,
        COALESCE(s.points_effective, s.points_generated) as points_generated,
        s.points_effective,
        s.product_name,
        s.quantity,
        s.description,
        s.campaign_id,
        s.status,
        s.receipt_url,
        s.created_at,
        a.name as architect_name,
        a.email as architect_email,
        COALESCE(NULLIF(a.telefone, ''), NULLIF(a.phone, ''), NULLIF(a.office_phone, '')) as architect_phone,
        a.document_ci as architect_document_ci,
        a.ruc as architect_ruc,
        a.company as architect_company,
        au.avatar_url as architect_avatar_url,
        st.name as store_name,
        st.email as store_email,
        COALESCE(NULLIF(st.phone, ''), NULLIF(st.office_phone, '')) as store_phone,
        st.owner_name as store_owner_name,
        st.cnpj as store_cnpj,
        st.ruc as store_ruc,
        st.city as store_city,
        c.title as campaign_title,
        c.points_multiplier
      FROM sales s
      LEFT JOIN architects a ON a.id = s.architect_id
      LEFT JOIN users au ON au.email = a.email
      LEFT JOIN stores st ON st.id = s.store_id
      LEFT JOIN campaigns c ON c.id = s.campaign_id
      ORDER BY s.created_at DESC`
    );

    return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
  } catch (error) {
    throw new AppError('Erro ao listar vendas', 400, error);
  }
}

export async function getSale(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sale = await db.oneOrNone(
      `SELECT
        s.id, s.architect_id, s.store_id, s.client_name, s.client_phone,
        s.amount_usd, COALESCE(s.points_effective, s.points_generated) as points_generated,
        s.points_effective, s.product_name, s.quantity, s.description,
        s.campaign_id, s.status, s.receipt_url, s.created_at, s.updated_at,
        a.name as architect_name,
        a.email as architect_email,
        COALESCE(NULLIF(a.telefone, ''), NULLIF(a.phone, ''), NULLIF(a.office_phone, '')) as architect_phone,
        a.document_ci as architect_document_ci,
        a.ruc as architect_ruc,
        a.company as architect_company,
        au.avatar_url as architect_avatar_url,
        st.name as store_name,
        st.email as store_email,
        COALESCE(NULLIF(st.phone, ''), NULLIF(st.office_phone, '')) as store_phone,
        st.owner_name as store_owner_name,
        st.cnpj as store_cnpj,
        st.ruc as store_ruc,
        st.city as store_city,
        c.title as campaign_title,
        c.points_multiplier
      FROM sales s
      LEFT JOIN architects a ON a.id = s.architect_id
      LEFT JOIN users au ON au.email = a.email
      LEFT JOIN stores st ON st.id = s.store_id
      LEFT JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = $1`,
      [id]
    );

    if (!sale) throw new AppError('Venda não encontrada', 404);

    return res.json({ success: true, data: sale });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao buscar venda', 400, error);
  }
}

export async function createSale(req: Request, res: Response) {
  try {
    const {
      architect_id, store_id, client_name, client_phone,
      amount_usd, description, product_name, quantity, receipt_url,
    } = req.body;

    if (!architect_id || !store_id || amount_usd === undefined || amount_usd === null) {
      throw new AppError('Arquiteto, loja e valor são obrigatórios', 400);
    }

    if (Number(amount_usd) < 0) {
      throw new AppError('Valor da venda não pode ser negativo', 400);
    }

    const architect = await db.oneOrNone(
      'SELECT id, profile_complete FROM architects WHERE id = $1',
      [architect_id]
    );
    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    // Gate: only accumulate points if profile is complete
    if (!architect.profile_complete) {
      throw new AppError(
        'Arquiteto deve completar o perfil antes de acumular pontos. Peça ao arquiteto que finalize o cadastro.',
        403
      );
    }

    const store = await db.oneOrNone('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (!store) throw new AppError('Loja não encontrada', 404);

    // Check for active campaign targeting architects
    const activeCampaign = await db.oneOrNone(
      `SELECT id, points_multiplier FROM campaigns
       WHERE active = true
         AND start_date <= CURRENT_DATE
         AND end_date >= CURRENT_DATE
         AND (focus = 'all' OR focus = 'architect')
       ORDER BY created_at DESC
       LIMIT 1`
    );

    const multiplier = activeCampaign ? Number(activeCampaign.points_multiplier) : 1.0;
    const pointsEffective = Math.floor(Number(amount_usd) * multiplier);

    const sale = await db.tx(async (tx) => {
      const newSale = await tx.one(
        `INSERT INTO sales (
          architect_id, store_id, client_name, client_phone, amount_usd,
          description, product_name, quantity, campaign_id, points_effective, status, receipt_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11)
        RETURNING *`,
        [
          architect_id, store_id,
          client_name || null, client_phone || null,
          amount_usd, description || null,
          product_name || null, quantity || 1,
          activeCampaign?.id || null, pointsEffective, receipt_url || null,
        ]
      );

      // Link sale to campaign for ranking
      if (activeCampaign) {
        await tx.none(
          `INSERT INTO campaign_sales (campaign_id, sale_id, points_earned) VALUES ($1, $2, $3)`,
          [activeCampaign.id, newSale.id, pointsEffective]
        );
      }

      // Update architect points total
      await tx.none(
        `UPDATE architects SET points_total = points_total + $1, updated_at = NOW() WHERE id = $2`,
        [pointsEffective, architect_id]
      );

      return newSale;
    });

    return res.status(201).json({
      success: true,
      data: { ...sale, points_generated: pointsEffective },
      message: `Venda criada com sucesso. ${pointsEffective} pontos gerados${activeCampaign ? ` (campanha ativa: ${multiplier}x)` : ''}.`,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao criar venda', 400, error);
  }
}

export async function updateSale(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { architect_id, store_id, client_name, client_phone, amount_usd, description, product_name, quantity } =
      req.body as Partial<SaleData>;

    const sale = await db.oneOrNone(
      `UPDATE sales
       SET
         architect_id = COALESCE($1, architect_id),
         store_id = COALESCE($2, store_id),
         client_name = COALESCE($3, client_name),
         client_phone = COALESCE($4, client_phone),
         amount_usd = COALESCE($5, amount_usd),
         description = COALESCE($6, description),
         product_name = COALESCE($7, product_name),
         quantity = COALESCE($8, quantity),
         updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        architect_id ?? null,
        store_id ?? null,
        client_name ?? null,
        client_phone ?? null,
        amount_usd ?? null,
        description ?? null,
        product_name ?? null,
        quantity ?? null,
        id,
      ]
    );

    if (!sale) throw new AppError('Venda não encontrada', 404);

    return res.json({ success: true, data: sale, message: 'Venda atualizada com sucesso' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar venda', 400, error);
  }
}

export async function deleteSale(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await db.result('DELETE FROM sales WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Venda deletada com sucesso' });
  } catch (error) {
    throw new AppError('Erro ao deletar venda', 400, error);
  }
}
