import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
} from '../controllers/sales.js';

const router = Router();

router.use(authenticateToken);

// GET sales for lojista's own store
router.get('/lojista', requireRole(['lojista']), asyncHandler(async (req: Request, res: Response) => {
  const uid = (req as any).user?.uid;
  const { db } = await import('../db/config.js');
  const userRole = await db.oneOrNone(
    `SELECT ur.store_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!userRole?.store_id) return res.json({ success: true, data: [], total: 0 });

  const sales = await db.manyOrNone(
    `SELECT s.*, a.name as architect_name, st.name as store_name
     FROM sales s
     LEFT JOIN architects a ON a.id = s.architect_id
     LEFT JOIN stores st ON st.id = s.store_id
     WHERE s.store_id = $1
     ORDER BY s.created_at DESC LIMIT 100`,
    [userRole.store_id]
  );
  return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
}));

// POST sale by lojista (auto-fills store_id)
router.post('/lojista', requireRole(['lojista']), asyncHandler(async (req: Request, res: Response) => {
  const uid = (req as any).user?.uid;
  const { db } = await import('../db/config.js');
  const userRole = await db.oneOrNone(
    `SELECT ur.store_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!userRole?.store_id) {
    return res.status(400).json({ success: false, error: 'Lojista sem loja associada' });
  }

  const { architect_id, client_name, client_phone, product_name, quantity, amount_usd, description } = req.body;
  if (!architect_id || !amount_usd) {
    return res.status(400).json({ success: false, error: 'architect_id e amount_usd são obrigatórios' });
  }

  const architect = await db.oneOrNone(
    'SELECT id, profile_complete FROM architects WHERE id = $1',
    [architect_id]
  );
  if (!architect) return res.status(404).json({ success: false, error: 'Arquiteto não encontrado' });
  if (!architect.profile_complete) {
    return res.status(403).json({ success: false, error: 'Arquiteto deve completar o perfil antes de acumular pontos' });
  }

  // Check for active campaign targeting all or architects
  const activeCampaign = await db.oneOrNone(
    `SELECT id, points_multiplier FROM campaigns
     WHERE active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
       AND (focus = 'all' OR focus = 'architect')
     ORDER BY created_at DESC LIMIT 1`
  );

  const multiplier = activeCampaign ? Number(activeCampaign.points_multiplier) : 1;
  const pointsEffective = Math.floor(Number(amount_usd) * multiplier);

  const sale = await db.tx(async (tx) => {
    // points_generated is GENERATED ALWAYS AS (FLOOR(amount_usd)) — do NOT include in INSERT
    const newSale = await tx.one(
      `INSERT INTO sales (architect_id, store_id, client_name, client_phone, product_name, quantity, amount_usd, campaign_id, points_effective, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [architect_id, userRole.store_id, client_name || null, client_phone || null,
       product_name || null, quantity || 1, amount_usd,
       activeCampaign?.id || null, pointsEffective, description || null]
    );

    // Update architect points
    await tx.none(
      `UPDATE architects SET points_total = points_total + $1, updated_at = NOW() WHERE id = $2`,
      [pointsEffective, architect_id]
    );

    // Link to campaign for ranking
    if (activeCampaign) {
      await tx.none(
        `INSERT INTO campaign_sales (campaign_id, sale_id, points_earned) VALUES ($1, $2, $3)`,
        [activeCampaign.id, newSale.id, pointsEffective]
      );
    }

    return newSale;
  });

  return res.status(201).json({
    success: true,
    data: { ...sale, points_generated: pointsEffective },
    message: `Venda registrada com sucesso. ${pointsEffective} pontos gerados${activeCampaign ? ` (campanha ativa: ${multiplier}x)` : ''}.`,
  });
}));

// GET own sales (architect role)
router.get('/my', requireRole(['architect']), asyncHandler(async (req: Request, res: Response) => {
  const uid = (req as any).user?.uid;
  const { db } = await import('../db/config.js');
  const userRole = await db.oneOrNone(
    `SELECT ur.architect_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.firebase_uid = $1`,
    [uid]
  );
  if (!userRole?.architect_id) return res.json({ success: true, data: [], total: 0 });

  const sales = await db.manyOrNone(
    `SELECT s.*, st.name as store_name FROM sales s
     LEFT JOIN stores st ON st.id = s.store_id
     WHERE s.architect_id = $1
     ORDER BY s.created_at DESC LIMIT 50`,
    [userRole.architect_id]
  );
  return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
}));

router.get('/', requireRole(['admin']), asyncHandler(listSales));
router.get('/:id', requireRole(['admin']), asyncHandler(getSale));
router.post('/', requireRole(['admin']), asyncHandler(createSale));
router.put('/:id', requireRole(['admin']), asyncHandler(updateSale));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteSale));

export default router;
