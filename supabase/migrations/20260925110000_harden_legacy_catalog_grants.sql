-- OHC Motors
-- Hardening da tabela legada pública.
--
-- anon/authenticated: somente leitura controlada por RLS.
-- service_role: não alterado.
--
-- REVERSÃO, caso realmente necessária:
-- GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
-- ON TABLE public."BASE DE DADOS DOS VOLANTES"
-- TO anon, authenticated;

BEGIN;

REVOKE ALL PRIVILEGES
ON TABLE public."BASE DE DADOS DOS VOLANTES"
FROM anon, authenticated;

GRANT SELECT
ON TABLE public."BASE DE DADOS DOS VOLANTES"
TO anon, authenticated;

COMMIT;
