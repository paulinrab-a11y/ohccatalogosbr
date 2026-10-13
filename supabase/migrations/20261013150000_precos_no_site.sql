-- OHC Motors
-- Preços no site (issue #62).
--
-- product_prices.active continua autorizando o preço na automação do WhatsApp.
-- A publicação no site é uma decisão separada: published_on_site, desligado por
-- padrão. O site lê somente as colunas de preço, e somente das linhas ativas e
-- publicadas; origem, confirmação e auditoria continuam privadas.
--
-- REVERSÃO:
-- DROP POLICY IF EXISTS product_prices_site_read ON public.product_prices;
-- REVOKE SELECT ON public.product_prices FROM anon, authenticated;
-- ALTER TABLE public.product_prices DROP COLUMN IF EXISTS published_on_site,
--   DROP COLUMN IF EXISTS card_price;

BEGIN;

ALTER TABLE public.product_prices
  ADD COLUMN IF NOT EXISTS card_price numeric
    CHECK (card_price IS NULL OR card_price > 0),
  ADD COLUMN IF NOT EXISTS published_on_site boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.product_prices.price IS
  'Preço no PIX (já com desconto), exibido no site quando publicado.';
COMMENT ON COLUMN public.product_prices.card_price IS
  'Preço total no cartão (até 12x). Opcional; sem ele o site não mostra valor de parcela.';
COMMENT ON COLUMN public.product_prices.published_on_site IS
  'Mostra este preço no site público. Independente de active (automação do WhatsApp).';

-- Column-level read: never source_document, confirmed_by or timestamps.
REVOKE ALL PRIVILEGES ON TABLE public.product_prices FROM anon, authenticated;
GRANT SELECT (
  sku,
  price,
  card_price,
  promotional_price,
  promotional_price_starts_at,
  promotional_price_ends_at,
  price_currency,
  active,
  published_on_site
) ON TABLE public.product_prices TO anon, authenticated;

DROP POLICY IF EXISTS product_prices_site_read ON public.product_prices;
CREATE POLICY product_prices_site_read
  ON public.product_prices
  FOR SELECT
  TO anon, authenticated
  USING (active IS TRUE AND published_on_site IS TRUE);

COMMIT;
