import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';

interface StoreData {
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  ramo?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

export async function listStores(_req: Request, res: Response) {
  try {
    const stores = await db.manyOrNone(
      `SELECT
        id,
        name as nome,
        cnpj,
        email,
        phone as telefone,
        branch as ramo,
        address as endereco,
        city as cidade,
        state as estado,
        country as pais,
        status,
        created_at
      FROM stores
      ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: stores || [],
      total: stores?.length || 0,
    });
  } catch (error) {
    throw new AppError('Erro ao listar lojas', 400, error);
  }
}

export async function getStore(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const store = await db.oneOrNone(
      `SELECT
        id,
        name as nome,
        cnpj,
        email,
        phone as telefone,
        branch as ramo,
        address as endereco,
        city as cidade,
        state as estado,
        country as pais,
        status,
        created_at,
        updated_at
      FROM stores
      WHERE id = $1`,
      [id]
    );

    if (!store) throw new AppError('Loja nao encontrada', 404);

    return res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    throw new AppError('Erro ao buscar loja', 400, error);
  }
}

export async function createStore(req: Request, res: Response) {
  try {
    const { nome, cnpj, email, telefone, ramo, endereco, cidade, estado, pais }: StoreData = req.body;

    if (!nome || !cnpj) {
      throw new AppError('Nome e CNPJ sao obrigatorios', 400);
    }

    const existing = await db.oneOrNone('SELECT id FROM stores WHERE cnpj = $1', [cnpj]);
    if (existing) {
      throw new AppError('Ja existe uma loja com este CNPJ', 409);
    }

    const store = await db.one(
      `INSERT INTO stores (name, cnpj, email, phone, branch, address, city, state, country, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING
         id,
         name as nome,
         cnpj,
         email,
         phone as telefone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         status,
         created_at`,
      [nome, cnpj, email || null, telefone || null, ramo || null, endereco || null, cidade || null, estado || null, pais || null]
    );

    return res.status(201).json({
      success: true,
      data: store,
      message: 'Loja criada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao criar loja', 400, error);
  }
}

export async function updateStore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nome, cnpj, email, telefone, ramo, endereco, cidade, estado, pais } = req.body as StoreData;

    const store = await db.oneOrNone(
      `UPDATE stores
       SET
         name = COALESCE($1, name),
         cnpj = COALESCE($2, cnpj),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         branch = COALESCE($5, branch),
         address = COALESCE($6, address),
         city = COALESCE($7, city),
         state = COALESCE($8, state),
         country = COALESCE($9, country),
         updated_at = NOW()
       WHERE id = $10
       RETURNING
         id,
         name as nome,
         cnpj,
         email,
         phone as telefone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         status,
         created_at,
         updated_at`,
      [nome ?? null, cnpj ?? null, email ?? null, telefone ?? null, ramo ?? null, endereco ?? null, cidade ?? null, estado ?? null, pais ?? null, id]
    );

    if (!store) throw new AppError('Loja nao encontrada', 404);

    return res.json({
      success: true,
      data: store,
      message: 'Loja atualizada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar loja', 400, error);
  }
}

export async function deleteStore(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.result('DELETE FROM stores WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Loja deletada com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao deletar loja', 400, error);
  }
}

export async function updateStoreStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'active' | 'inactive' };

    if (!['active', 'inactive'].includes(status)) {
      throw new AppError('Status invalido', 400);
    }

    const store = await db.oneOrNone(
      `UPDATE stores
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING
         id,
         name as nome,
         cnpj,
         email,
         phone as telefone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         status,
         created_at,
         updated_at`,
      [status, id]
    );

    if (!store) throw new AppError('Loja nao encontrada', 404);

    return res.json({
      success: true,
      data: store,
      message: 'Status da loja atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar status da loja', 400, error);
  }
}
