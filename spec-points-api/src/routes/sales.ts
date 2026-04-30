import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest, loadUserContext } from '../middleware/auth.js';
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
  const user = await loadUserContext(req as AuthRequest);
  if (!user?.storeId) return res.json({ success: true, data: [], total: 0 });

  const { db } = await import('../db/config.js');
  const sales = await db.manyOrNone(
    `SELECT
            s.*,
            COALESCE(s.points_effective, s.points_generated) as points_generated,
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
            st.city as store_city
     FROM sales s
     LEFT JOIN architects a ON a.id = s.architect_id
     LEFT JOIN users au ON au.email = a.email
     LEFT JOIN stores st ON st.id = s.store_id
     WHERE s.store_id = $1
     ORDER BY s.created_at DESC LIMIT 100`,
    [user.storeId]
  );
  return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
}));

// POST sale by lojista (auto-fills store_id)
router.post('/lojista', requireRole(['lojista']), asyncHandler(async (req: Request, res: Response) => {
  const user = await loadUserContext(req as AuthRequest);
  const { db } = await import('../db/config.js');

  if (!user?.storeId) {
    return res.status(400).json({ success: false, error: 'Lojista sem loja associada' });
  }

  const { architect_id, client_name, client_phone, product_name, quantity, amount_usd, description, receipt_url } = req.body;
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
      `INSERT INTO sales (architect_id, store_id, client_name, client_phone, product_name, quantity, amount_usd, campaign_id, points_effective, description, status, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11) RETURNING *`,
      [architect_id, user.storeId, client_name || null, client_phone || null,
       product_name || null, quantity || 1, amount_usd,
       activeCampaign?.id || null, pointsEffective, description || null, receipt_url || null]
    );

    // Points and campaign linkage will be done only on approval.
    return newSale;
  });

  return res.status(201).json({
    success: true,
    data: { ...sale, points_generated: pointsEffective },
    message: `Venda registrada com sucesso e enviada para aprovação.`
  });
}));

// GET own sales (architect role)
router.get('/my', requireRole(['architect']), asyncHandler(async (req: Request, res: Response) => {
  const user = await loadUserContext(req as AuthRequest);
  if (!user?.architectId) return res.json({ success: true, data: [], total: 0 });

  const { db } = await import('../db/config.js');
  const sales = await db.manyOrNone(
    `SELECT s.*, COALESCE(s.points_effective, s.points_generated) as points_generated,
            st.name as store_name
     FROM sales s
     LEFT JOIN stores st ON st.id = s.store_id
     WHERE s.architect_id = $1
     ORDER BY s.created_at DESC LIMIT 50`,
    [user.architectId]
  );
  return res.json({ success: true, data: sales || [], total: sales?.length || 0 });
}));

router.post('/:id/approve', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { db } = await import('../db/config.js');

  const sale = await db.oneOrNone('SELECT * FROM sales WHERE id = $1', [id]);
  if (!sale) return res.status(404).json({ success: false, error: 'Venda não encontrada' });
  if (sale.status !== 'pending') return res.status(400).json({ success: false, error: 'Apenas vendas pendentes podem ser aprovadas' });
  const pointsToCredit = sale.points_effective ?? sale.points_generated;

  await db.tx(async (tx) => {
    await tx.none("UPDATE sales SET status = 'approved', updated_at = NOW() WHERE id = $1", [id]);
    await tx.none('UPDATE architects SET points_total = points_total + $1, updated_at = NOW() WHERE id = $2', [pointsToCredit, sale.architect_id]);

    if (sale.campaign_id) {
      await tx.none('INSERT INTO campaign_sales (campaign_id, sale_id, points_earned) VALUES ($1, $2, $3)', [sale.campaign_id, sale.id, pointsToCredit]);
    }
  });

  return res.json({ success: true, message: 'Venda aprovada com sucesso e pontos gerados' });
}));

router.post('/:id/reject', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { db } = await import('../db/config.js');

  const sale = await db.oneOrNone('SELECT * FROM sales WHERE id = $1', [id]);
  if (!sale) return res.status(404).json({ success: false, error: 'Venda não encontrada' });
  if (sale.status !== 'pending') return res.status(400).json({ success: false, error: 'Apenas vendas pendentes podem ser rejeitadas' });

  await db.none("UPDATE sales SET status = 'rejected', updated_at = NOW() WHERE id = $1", [id]);

  return res.json({ success: true, message: 'Venda rejeitada' });
}));

router.get('/', requireRole(['admin']), asyncHandler(listSales));
router.get('/:id', requireRole(['admin']), asyncHandler(getSale));
router.post('/', requireRole(['admin']), asyncHandler(createSale));
router.put('/:id', requireRole(['admin']), asyncHandler(updateSale));
router.delete('/:id', requireRole(['admin']), asyncHandler(deleteSale));

export default router;
