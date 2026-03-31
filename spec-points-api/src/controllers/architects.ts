import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { AppError } from '../middleware/error-handler.js';

interface ArchitectData {
  email: string;
  nome: string;
  empresa: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

// GET all architects
export async function listArchitects(_req: Request, res: Response) {
  try {
    const architects = await db.manyOrNone(
      `SELECT id, email, name as nome, company as empresa, telefone, status, city as cidade, state as estado, created_at 
       FROM architects 
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: architects || [],
      total: architects?.length || 0,
    });
  } catch (error) {
    throw new AppError('Erro ao listar arquitetos', 400, error);
  }
}

// GET single architect
export async function getArchitect(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const architect = await db.oneOrNone(
      'SELECT * FROM architects WHERE id = $1',
      [id]
    );

    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    return res.json({
      success: true,
      data: architect,
    });
  } catch (error) {
    throw new AppError('Erro ao buscar arquiteto', 400, error);
  }
}

// CREATE architect
export async function createArchitect(req: Request, res: Response) {
  try {
    const { email, nome, empresa, telefone, cep, endereco, numero, complemento, bairro, cidade, estado }: ArchitectData = req.body;

    // Validate required fields
    if (!email || !nome || !empresa || !telefone) {
      throw new AppError('Email, nome, empresa e telefone são obrigatórios', 400);
    }

    // Check if architect already exists
    const existing = await db.oneOrNone(
      'SELECT id FROM architects WHERE email = $1',
      [email]
    );

    if (existing) {
      throw new AppError('Arquiteto com este email já existe', 409);
    }

    const architect = await db.one(
      `INSERT INTO architects (email, name, company, telefone, cep, address, number, complement, neighborhood, city, state, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [email, nome, empresa, telefone, cep, endereco, numero, complemento || null, bairro, cidade, estado]
    );

    return res.status(201).json({
      success: true,
      data: architect,
      message: 'Arquiteto criado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao criar arquiteto', 400, error);
  }
}

// UPDATE architect
export async function updateArchitect(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);

    const architect = await db.oneOrNone(
      `UPDATE architects SET ${fields} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );

    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    return res.json({
      success: true,
      data: architect,
      message: 'Arquiteto atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar arquiteto', 400, error);
  }
}

// DELETE architect
export async function deleteArchitect(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.result(
      'DELETE FROM architects WHERE id = $1',
      [id]
    );

    return res.json({
      success: true,
      message: 'Arquiteto deletado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao deletar arquiteto', 400, error);
  }
}

// UPDATE architect status
export async function updateArchitectStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'inactive'].includes(status)) {
      throw new AppError('Status inválido', 400);
    }

    const architect = await db.oneOrNone(
      'UPDATE architects SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (!architect) throw new AppError('Arquiteto não encontrado', 404);

    return res.json({
      success: true,
      data: architect,
      message: 'Status atualizado com sucesso',
    });
  } catch (error) {
    throw new AppError('Erro ao atualizar status', 400, error);
  }
}
