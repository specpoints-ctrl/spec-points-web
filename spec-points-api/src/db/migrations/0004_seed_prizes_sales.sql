-- SpecPoints Migration 0004
-- Seed: sample prizes and sales for testing

-- Prizes catalog
INSERT INTO prizes (name, description, points_required, stock, active) VALUES
  ('Passagem Aerea Nacional',  'Passagem aerea para qualquer destino nacional (ida e volta)', 5000,  3, true),
  ('iPhone 15 128GB',          'Apple iPhone 15 128GB - qualquer cor disponivel',              8000,  2, true),
  ('Smart TV 55" 4K',          'Samsung Smart TV 55 polegadas QLED 4K',                        6500,  5, true),
  ('Hotel 5 Estrelas',         'Diaria para 2 em hotel 5 estrelas no Brasil',                  3000, 10, true),
  ('Notebook Dell Inspiron',   'Dell Inspiron 15 - i5, 16GB RAM, 512GB SSD',                  10000,  2, true),
  ('AirPods Pro 2a Geracao',   'Apple AirPods Pro com Cancelamento Ativo de Ruido',             2000, 10, true),
  ('Vale Presente R$500',      'Vale presente para uso em lojas parceiras SpecPoints',            500, 50, true)
ON CONFLICT DO NOTHING;

-- Sample sales for test architect (id=4) at test store (id=1)
INSERT INTO sales (architect_id, store_id, client_name, client_phone, amount_usd, description, created_at) VALUES
  (4, 1, 'Carlos Mendes',   '(11) 91234-5678', 750.00,  'Piso porcelanato 80x80 - casa em alphaville',    NOW() - INTERVAL '2 days'),
  (4, 1, 'Fernanda Lima',   '(11) 97654-3210', 1200.00, 'Revestimento fachada - predio comercial',        NOW() - INTERVAL '5 days'),
  (4, 1, 'Roberto Alves',   '(11) 98888-1111', 430.00,  'Azulejo banheiro master - apartamento',         NOW() - INTERVAL '8 days'),
  (4, 1, 'Patricia Gomes',  '(21) 99123-4567', 2100.00, 'Pedra quartzito para bancadas - casa de campo', NOW() - INTERVAL '12 days'),
  (4, 1, 'Andre Rodrigues', '(11) 94567-8901', 890.00,  'Madeira acabamento deck externo',               NOW() - INTERVAL '18 days')
ON CONFLICT DO NOTHING;

-- Sync architect points_total from actual sales
UPDATE architects
SET points_total = COALESCE((SELECT SUM(s.points_generated) FROM sales s WHERE s.architect_id = 4), 0),
    updated_at = NOW()
WHERE id = 4;
