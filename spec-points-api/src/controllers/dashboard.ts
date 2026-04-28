import { Request, Response } from 'express';
import { db } from '../db/config.js';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [totals, recentSales, topArchitects] = await Promise.all([
      db.one(
        `SELECT
          (SELECT COUNT(*)::int FROM architects) as architects,
          (SELECT COUNT(*)::int FROM stores) as stores,
          (SELECT COUNT(*)::int FROM sales) as sales,
          (
            SELECT COALESCE(SUM(COALESCE(points_effective, points_generated)), 0)::bigint
            FROM sales
          ) as total_points`
      ),
      db.manyOrNone(
        `SELECT s.*, COALESCE(s.points_effective, s.points_generated) as points_generated,
                a.name as architect_name, st.name as store_name,
                u.avatar_url as architect_avatar, st.logo_url as store_logo
         FROM sales s
         LEFT JOIN architects a ON s.architect_id = a.id
         LEFT JOIN stores st ON s.store_id = st.id
         LEFT JOIN users u ON u.email = a.email
         ORDER BY s.created_at DESC
         LIMIT 10`
      ),
      db.manyOrNone(
        `SELECT a.id, a.name, a.email,
                COALESCE(SUM(COALESCE(s.points_effective, s.points_generated)), 0) as total_points,
                COUNT(s.id) as total_sales,
                u.avatar_url
         FROM architects a
         LEFT JOIN sales s ON a.id = s.architect_id
         LEFT JOIN users u ON u.email = a.email
         GROUP BY a.id, a.name, a.email, u.avatar_url
         ORDER BY total_points DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      success: true,
      data: {
        architects: Number(totals.architects || 0),
        stores: Number(totals.stores || 0),
        sales: Number(totals.sales || 0),
        totalPoints: Number(totals.total_points || 0),
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
