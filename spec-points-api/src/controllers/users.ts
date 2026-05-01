import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { logger } from '../index.js';

// List pending users (admin only)
export const listPendingUsers = async (_req: Request, res: Response) => {
  try {
    const users = await db.manyOrNone(
      `SELECT
              u.id,
              u.firebase_uid,
              u.email,
              u.display_name,
              u.avatar_url,
              u.instagram_handle,
              u.status,
              u.created_at,
              ur.role,
              ur.architect_id,
              ur.store_id,
              a.name as architect_name,
              a.company as architect_company,
              COALESCE(NULLIF(a.telefone, ''), NULLIF(a.phone, ''), NULLIF(a.office_phone, '')) as architect_phone,
              a.office_phone as architect_office_phone,
              a.document_ci as architect_document_ci,
              a.ruc as architect_ruc,
              a.city as architect_city,
              a.state as architect_state,
              a.address as architect_address,
              a.birthday as architect_birthday,
              a.profile_complete as architect_profile_complete,
              s.name as store_name,
              s.email as store_email,
              s.cnpj as store_cnpj,
              s.ruc as store_ruc,
              s.owner_name as store_owner_name,
              s.owner_ci as store_owner_ci,
              COALESCE(NULLIF(s.phone, ''), NULLIF(s.office_phone, '')) as store_phone,
              s.office_phone as store_office_phone,
              s.city as store_city,
              s.state as store_state,
              s.address as store_address,
              s.owner_birthday as store_owner_birthday,
              s.profile_complete as store_profile_complete
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN architects a ON ur.architect_id = a.id
       LEFT JOIN stores s ON ur.store_id = s.id
       WHERE u.status = 'pending'
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: users || [],
      total: users?.length || 0,
    });
  } catch (error) {
    logger.error('List pending users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list pending users',
    });
  }
};

// Get user details (admin only)
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await db.oneOrNone(
      `SELECT
              u.id,
              u.firebase_uid,
              u.email,
              u.display_name,
              u.avatar_url,
              u.instagram_handle,
              u.status,
              u.created_at,
              ur.role,
              ur.architect_id,
              ur.store_id,
              a.name as architect_name,
              a.email as architect_email,
              a.company as architect_company,
              COALESCE(NULLIF(a.telefone, ''), NULLIF(a.phone, ''), NULLIF(a.office_phone, '')) as architect_phone,
              a.office_phone as architect_office_phone,
              a.document_ci as architect_document_ci,
              a.ruc as architect_ruc,
              a.city as architect_city,
              a.state as architect_state,
              a.address as architect_address,
              a.birthday as architect_birthday,
              a.profile_complete as architect_profile_complete,
              s.name as store_name,
              s.email as store_email,
              s.cnpj as store_cnpj,
              s.ruc as store_ruc,
              s.owner_name as store_owner_name,
              s.owner_ci as store_owner_ci,
              COALESCE(NULLIF(s.phone, ''), NULLIF(s.office_phone, '')) as store_phone,
              s.office_phone as store_office_phone,
              s.city as store_city,
              s.state as store_state,
              s.address as store_address,
              s.owner_birthday as store_owner_birthday,
              s.profile_complete as store_profile_complete
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN architects a ON ur.architect_id = a.id
       LEFT JOIN stores s ON ur.store_id = s.id
       WHERE u.id = $1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details',
    });
  }
};

// Approve user (admin only)
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUid = (req as any).user?.uid ?? 'system';

    // Get user
    const user = await db.oneOrNone(
      'SELECT id, status FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'User is not in pending status',
      });
    }

    // Update user status to active
    const updatedUser = await db.one(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      ['active', userId]
    );

    // Log audit
    await db.none(
      `INSERT INTO security_audit_log (user_id, action, resource) 
       VALUES (NULL, 'USER_APPROVED', $1)`,
      [`Admin ${adminUid} approved user ${user.id}`]
    );

    logger.info(`User approved: ${userId}`);

    res.json({
      success: true,
      message: 'User approved successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve user',
    });
  }
};

// Reject user (admin only)
export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminUid = (req as any).user?.uid ?? 'system';

    // Get user
    const user = await db.oneOrNone(
      'SELECT id, status, email FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'User is not in pending status',
      });
    }

    // Update user status to blocked
    const updatedUser = await db.one(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      ['blocked', userId]
    );

    // Log audit with reason
    await db.none(
      `INSERT INTO security_audit_log (user_id, action, resource, old_value, new_value) 
       VALUES (NULL, 'USER_REJECTED', $1, $2, $3)`,
      [`Admin ${adminUid} rejected user ${user.id}`, user.status, `Reason: ${reason || 'No reason provided'}`]
    );

    logger.info(`User rejected: ${userId}`);

    res.json({
      success: true,
      message: 'User rejected successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject user',
    });
  }
};

// List all users (admin only - with filters)
export const listAllUsers = async (req: Request, res: Response) => {
  try {
    const { status, role, limit = 50, offset = 0 } = req.query;

    let query = `SELECT u.id, u.firebase_uid, u.email, u.display_name, u.instagram_handle, u.status, u.created_at,
              ur.role, ur.architect_id, ur.store_id,
              a.name as architect_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN architects a ON ur.architect_id = a.id
       WHERE 1=1`;

    const params: any[] = [];

    if (status) {
      query += ` AND u.status = $${params.length + 1}`;
      params.push(status);
    }

    if (role) {
      query += ` AND ur.role = $${params.length + 1}`;
      params.push(role);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string) || 50);
    params.push(parseInt(offset as string) || 0);

    const users = await db.manyOrNone(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users u
                     LEFT JOIN user_roles ur ON u.id = ur.user_id
                     WHERE 1=1`;

    const countParams: any[] = [];
    if (status) {
      countQuery += ` AND u.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    if (role) {
      countQuery += ` AND ur.role = $${countParams.length + 1}`;
      countParams.push(role);
    }

    const countResult = await db.one(countQuery, countParams);
    const total = parseInt(countResult.total || '0');

    res.json({
      success: true,
      data: users || [],
      total: total,
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
    });
  }
};
