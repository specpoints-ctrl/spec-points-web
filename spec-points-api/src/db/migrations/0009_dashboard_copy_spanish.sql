-- SpecPoints Migration 0009
-- Normalize dashboard copy to Spanish
-- Created: 2026-04-27

UPDATE dashboard_configs
SET message = CASE role
  WHEN 'architect' THEN '¡Bienvenido a SpecPoints! Acumula puntos y canjéalos por premios increíbles.'
  WHEN 'lojista' THEN 'Registra las ventas de los arquitectos y acompaña el desempeño de tu tienda.'
  ELSE message
END
WHERE role IN ('architect', 'lojista');
