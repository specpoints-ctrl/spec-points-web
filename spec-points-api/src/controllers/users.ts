import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { logger } from '../index.js';

// List pending users (admin only)
export const listPendingUsers = async (_req: Request, res: Response) => {
  try {
    const users = await db.manyOrNone(
      `SELECT u.id, u.firebase_uid, u.email, u.status, u.created_at,
              ur.role, ur.architect_id, ur.store_id,
              a.name as architect_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN architects a ON ur.architect_id = a.id
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
      `SELECT u.id, u.firebase_uid, u.email, u.status, u.created_at,
              ur.role, ur.architect_id, ur.store_id,
              a.name as architect_name, a.email as architect_email, a.company
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN architects a ON ur.architect_id = a.id
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
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin ID not found in token',
      });
    }

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
       VALUES ($1, 'USER_APPROVED', $2)`,
      [adminId, `User ${user.id} approved`]
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
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin ID not found in token',
      });
    }

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
       VALUES ($1, 'USER_REJECTED', $2, $3, $4)`,
      [adminId, `User ${user.id} rejected`, user.status, `Reason: ${reason || 'No reason provided'}`]
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

    let query = `SELECT u.id, u.firebase_uid, u.email, u.status, u.created_at,
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
