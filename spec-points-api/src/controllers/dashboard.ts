import { Request, Response } from 'express';
import { db } from '../db/config.js';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    // Get total architects
    const architectsCount = await db.oneOrNone(
      'SELECT COUNT(*) as count FROM architects'
    );

    // Get total stores
    const storesCount = await db.oneOrNone(
      'SELECT COUNT(*) as count FROM stores'
    );

    // Get total sales
    const salesCount = await db.oneOrNone(
      'SELECT COUNT(*) as count FROM sales'
    );

    // Get total points distributed
    const pointsCount = await db.oneOrNone(
      'SELECT COALESCE(SUM(points_generated), 0) as total FROM sales'
    );

    // Get recent sales
    const recentSales = await db.manyOrNone(
      `SELECT s.*, a.name as architect_name, st.name as store_name 
       FROM sales s
       LEFT JOIN architects a ON s.architect_id = a.id
       LEFT JOIN stores st ON s.store_id = st.id
       ORDER BY s.created_at DESC
       LIMIT 10`
    );

    // Get top 5 architects
    const topArchitects = await db.manyOrNone(
      `SELECT a.id, a.name, a.email, 
              COALESCE(SUM(s.points_generated), 0) as total_points,
              COUNT(s.id) as total_sales
       FROM architects a
       LEFT JOIN sales s ON a.id = s.architect_id
       GROUP BY a.id, a.name, a.email
       ORDER BY total_points DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        architects: parseInt(architectsCount?.count || 0),
        stores: parseInt(storesCount?.count || 0),
        sales: parseInt(salesCount?.count || 0),
        totalPoints: parseInt(pointsCount?.total || 0),
        recentSales,
        topArchitects,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};
