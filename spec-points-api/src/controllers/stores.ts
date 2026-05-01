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
  logo_url?: string;
}

export async function listStores(_req: Request, res: Response) {
  try {
    const stores = await db.manyOrNone(
      `SELECT
        s.id,
        s.name as nome,
        s.cnpj,
        s.email,
        COALESCE(NULLIF(s.phone, ''), NULLIF(s.office_phone, '')) as telefone,
        s.office_phone,
        s.branch as ramo,
        s.address as endereco,
        s.city as cidade,
        s.state as estado,
        s.country as pais,
        s.logo_url,
        s.owner_name,
        s.owner_ci,
        s.ruc,
        s.owner_birthday,
        s.profile_complete,
        s.status,
        s.created_at,
        linked_user.account_email,
        linked_user.account_status,
        linked_user.instagram_handle
      FROM stores s
      LEFT JOIN LATERAL (
        SELECT
          u.email as account_email,
          u.status as account_status,
          u.instagram_handle
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.store_id = s.id
        ORDER BY u.created_at ASC
        LIMIT 1
      ) linked_user ON true
      ORDER BY s.created_at DESC`
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
        s.id,
        s.name as nome,
        s.cnpj,
        s.email,
        COALESCE(NULLIF(s.phone, ''), NULLIF(s.office_phone, '')) as telefone,
        s.office_phone,
        s.branch as ramo,
        s.address as endereco,
        s.city as cidade,
        s.state as estado,
        s.country as pais,
        s.logo_url,
        s.owner_name,
        s.owner_ci,
        s.ruc,
        s.owner_birthday,
        s.profile_complete,
        s.status,
        s.created_at,
        s.updated_at,
        linked_user.account_email,
        linked_user.account_status,
        linked_user.instagram_handle
      FROM stores s
      LEFT JOIN LATERAL (
        SELECT
          u.email as account_email,
          u.status as account_status,
          u.instagram_handle
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.store_id = s.id
        ORDER BY u.created_at ASC
        LIMIT 1
      ) linked_user ON true
      WHERE s.id = $1`,
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
    const { nome, cnpj, email, telefone, ramo, endereco, cidade, estado, pais, logo_url }: StoreData = req.body;

    if (!nome || !cnpj) {
      throw new AppError('Nome e CNPJ sao obrigatorios', 400);
    }

    const existing = await db.oneOrNone('SELECT id FROM stores WHERE cnpj = $1', [cnpj]);
    if (existing) {
      throw new AppError('Ja existe uma loja com este CNPJ', 409);
    }

    const store = await db.one(
      `INSERT INTO stores (name, cnpj, email, phone, branch, address, city, state, country, logo_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING
         id,
         name as nome,
         cnpj,
         email,
         phone as telefone,
         office_phone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         logo_url,
         owner_name,
         owner_ci,
         ruc,
         owner_birthday,
         profile_complete,
         status,
         created_at`,
      [
        nome,
        cnpj,
        email || null,
        telefone || null,
        ramo || null,
        endereco || null,
        cidade || null,
        estado || null,
        pais || null,
        logo_url || null,
      ]
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
    const { nome, cnpj, email, telefone, ramo, endereco, cidade, estado, pais, logo_url } = req.body as StoreData;

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
         logo_url = COALESCE($10, logo_url),
         updated_at = NOW()
       WHERE id = $11
       RETURNING
         id,
         name as nome,
         cnpj,
         email,
         COALESCE(NULLIF(phone, ''), NULLIF(office_phone, '')) as telefone,
         office_phone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         logo_url,
         owner_name,
         owner_ci,
         ruc,
         owner_birthday,
         profile_complete,
         status,
         created_at,
         updated_at`,
      [
        nome ?? null,
        cnpj ?? null,
        email ?? null,
        telefone ?? null,
        ramo ?? null,
        endereco ?? null,
        cidade ?? null,
        estado ?? null,
        pais ?? null,
        logo_url ?? null,
        id,
      ]
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

    await db.tx(async (tx) => {
      await tx.none('DELETE FROM user_roles WHERE store_id = $1', [id]);
      await tx.result('DELETE FROM stores WHERE id = $1', [id]);
    });

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
         COALESCE(NULLIF(phone, ''), NULLIF(office_phone, '')) as telefone,
         office_phone,
         branch as ramo,
         address as endereco,
         city as cidade,
         state as estado,
         country as pais,
         logo_url,
         owner_name,
         owner_ci,
         ruc,
         owner_birthday,
         profile_complete,
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
