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
        s.points_generated,
        s.description,
        s.created_at,
        a.name as architect_name,
        st.name as store_name
      FROM sales s
      LEFT JOIN architects a ON a.id = s.architect_id
      LEFT JOIN stores st ON st.id = s.store_id
      ORDER BY s.created_at DESC`
    );

    return res.json({
      success: true,
      data: sales || [],
      total: sales?.length || 0,
    });
  } catch (error) {
    throw new AppError('Erro ao listar vendas', 400, error);
  }
}

export async function getSale(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sale = await db.oneOrNone(
      `SELECT
        s.id,
        s.architect_id,
        s.store_id,
        s.client_name,
        s.client_phone,
        s.amount_usd,
        s.points_generated,
        s.description,
        s.created_at,
        s.updated_at,
        a.name as architect_name,
        st.name as store_name
      FROM sales s
      LEFT JOIN architects a ON a.id = s.architect_id
      LEFT JOIN stores st ON st.id = s.store_id
      WHERE s.id = $1`,
      [id]
    );

    if (!sale) throw new AppError('Venda nao encontrada', 404);

    return res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    throw new AppError('Erro ao buscar venda', 400, error);
  }
}

export async function createSale(req: Request, res: Response) {
  try {
    const { architect_id, store_id, client_name, client_phone, amount_usd, description }: SaleData = req.body;

    if (!architect_id || !store_id || amount_usd === undefined || amount_usd === null) {
      throw new AppError('Arquiteto, loja e valor sao obrigatorios', 400);
    }

    if (Number(amount_usd) < 0) {
      throw new AppError('Valor da venda nao pode ser negativo', 400);
    }

    const architect = await db.oneOrNone('SELECT id FROM architects WHERE id = $1', [architect_id]);
    if (!architect) throw new AppError('Arquiteto nao encontrado', 404);

    const store = await db.oneOrNone('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (!store) throw new AppError('Loja nao encontrada', 404);

    const sale = await db.one(
      `INSERT INTO sales (architect_id, store_id, client_name, client_phone, amount_usd, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, architect_id, store_id, client_name, client_phone, amount_usd, points_generated, description, created_at`,
      [architect_id, store_id, client_name || null, client_phone || null, amount_usd, description || null]
    );

    return res.status(201).json({
      success: true,
      data: sale,
      message: 'Venda criada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao criar venda', 400, error);
  }
}

export async function updateSale(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { architect_id, store_id, client_name, client_phone, amount_usd, description } = req.body as Partial<SaleData>;

    const sale = await db.oneOrNone(
      `UPDATE sales
       SET
         architect_id = COALESCE($1, architect_id),
         store_id = COALESCE($2, store_id),
         client_name = COALESCE($3, client_name),
         client_phone = COALESCE($4, client_phone),
         amount_usd = COALESCE($5, amount_usd),
         description = COALESCE($6, description),
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, architect_id, store_id, client_name, client_phone, amount_usd, points_generated, description, created_at, updated_at`,
      [
        architect_id ?? null,
        store_id ?? null,
        client_name ?? null,
        client_phone ?? null,
        amount_usd ?? null,
        description ?? null,
        id,
      ]
    );

    if (!sale) throw new AppError('Venda nao encontrada', 404);

    return res.json({
      success: true,
      data: sale,
      message: 'Venda atualizada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar venda', 400, error);
  }
}

export async function deleteSale(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.result('DELETE FROM sales WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Venda deletada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao deletar venda', 400, error);
  }
}
