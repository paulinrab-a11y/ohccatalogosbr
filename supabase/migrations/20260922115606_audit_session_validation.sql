-- Additive. Deploy only in staging first, before the revised Edge Function.
-- Service-only predicate: never return session details or expose auth schema.
BEGIN;
CREATE FUNCTION public.ohc_audit_session_active(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.sessions s
    WHERE s.id = p_session_id AND s.user_id = p_user_id
      AND (s.not_after IS NULL OR s.not_after > now())
  );
$$;
REVOKE ALL ON FUNCTION public.ohc_audit_session_active(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ohc_audit_session_active(uuid, uuid) TO service_role;
COMMIT;
