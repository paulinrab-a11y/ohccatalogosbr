-- Staging first. Additive objects only; no production data changed by installation.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ohc_audit_private;
REVOKE ALL ON SCHEMA ohc_audit_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA ohc_audit_private TO authenticated, service_role;
CREATE TABLE public.ohc_audit_rate_limits (
  scope text NOT NULL,
  actor_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL,
  PRIMARY KEY (scope,actor_hash)
);
ALTER TABLE public.ohc_audit_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ohc_audit_rate_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ohc_audit_rate_limits TO service_role;
CREATE FUNCTION public.ohc_audit_consume_limit(p_scope text,p_origin text,p_account text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 v_limit integer; v_account_limit integer; v_window integer:=900; v_hash text;
 v_hits integer; v_start timestamptz; v_now timestamptz:=clock_timestamp(); v_retry integer:=0;
BEGIN
 CASE p_scope
 WHEN 'otp-send' THEN v_limit:=20;v_account_limit:=5;
 WHEN 'otp-verify' THEN v_limit:=60;v_account_limit:=10;
 WHEN 'public-submit' THEN v_limit:=10;v_account_limit:=10;v_window:=60;
 ELSE RAISE EXCEPTION 'invalid_scope'; END CASE;
 IF p_origin IS NULL OR p_origin !~ '^[a-f0-9]{64}$' OR (p_account IS NOT NULL AND p_account !~ '^[a-f0-9]{64}$') THEN RAISE EXCEPTION 'invalid_actor';END IF;
 -- An origin has bounded use regardless of how many account identifiers it supplies.
 FOREACH v_hash IN ARRAY array_remove(ARRAY[p_origin,p_account],NULL) LOOP
  INSERT INTO public.ohc_audit_rate_limits(scope,actor_hash,window_start,hits) VALUES(p_scope,v_hash,v_now,1)
  ON CONFLICT(scope,actor_hash) DO UPDATE SET
   window_start=CASE WHEN ohc_audit_rate_limits.window_start<=v_now-make_interval(secs=>v_window) THEN v_now ELSE ohc_audit_rate_limits.window_start END,
   hits=CASE WHEN ohc_audit_rate_limits.window_start<=v_now-make_interval(secs=>v_window) THEN 1 ELSE LEAST(ohc_audit_rate_limits.hits+1,1000000) END
  RETURNING hits,window_start INTO v_hits,v_start;
  IF v_hits>(CASE WHEN v_hash=p_origin THEN v_limit ELSE v_account_limit END) THEN
   v_retry:=GREATEST(v_retry,1,CEIL(v_window-extract(epoch FROM(v_now-v_start)))::integer);
  END IF;
 END LOOP;
 -- Only hashed transient counters, with short retention and bounded cleanup work.
 DELETE FROM public.ohc_audit_rate_limits WHERE (scope,actor_hash) IN
  (SELECT scope,actor_hash FROM public.ohc_audit_rate_limits WHERE window_start<v_now-interval '1 day' LIMIT 100);
 RETURN jsonb_build_object('allowed',v_retry=0,'retry_after',v_retry);
END;$$;
REVOKE ALL ON FUNCTION public.ohc_audit_consume_limit(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ohc_audit_consume_limit(text,text,text) TO service_role;
CREATE TABLE public.ohc_admin_role_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL,target_id uuid NOT NULL,
 make_admin boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ohc_admin_role_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ohc_admin_role_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.ohc_admin_role_audit TO service_role;
CREATE FUNCTION ohc_audit_private.change_admin_role(p_email text,p_make_admin boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_actor uuid:=auth.uid();v_target auth.users%ROWTYPE;v_session uuid;
BEGIN
 IF v_actor IS NULL OR p_make_admin IS NULL OR length(p_email)>254 THEN RETURN jsonb_build_object('ok',false,'error','not_authorized');END IF;
 BEGIN v_session:=(auth.jwt()->>'session_id')::uuid;EXCEPTION WHEN others THEN RETURN jsonb_build_object('ok',false,'error','not_authorized');END;
 PERFORM pg_advisory_xact_lock(71020922,1);
 -- Recheck actor AFTER acquiring lock: two admins cannot remove each other concurrently.
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=v_actor AND raw_app_meta_data->>'role'='ohc_admin')
 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=v_session AND user_id=v_actor AND (not_after IS NULL OR not_after>now()))
 THEN RETURN jsonb_build_object('ok',false,'error','not_authorized');END IF;
 SELECT * INTO v_target FROM auth.users WHERE lower(email)=lower(trim(p_email));
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','user_not_found');END IF;
 IF NOT p_make_admin AND v_target.raw_app_meta_data->>'role'='ohc_admin' THEN
  IF v_target.id=v_actor THEN RETURN jsonb_build_object('ok',false,'error','cannot_remove_self');END IF;
  IF (SELECT count(*) FROM auth.users WHERE raw_app_meta_data->>'role'='ohc_admin')<=1 THEN RETURN jsonb_build_object('ok',false,'error','last_admin');END IF;
 END IF;
 UPDATE auth.users SET raw_app_meta_data=CASE WHEN p_make_admin THEN coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"ohc_admin"}'::jsonb ELSE coalesce(raw_app_meta_data,'{}'::jsonb)-'role' END,updated_at=now() WHERE id=v_target.id;
 INSERT INTO public.ohc_admin_role_audit(actor_id,target_id,make_admin)VALUES(v_actor,v_target.id,p_make_admin);
 RETURN jsonb_build_object('ok',true,'admin',jsonb_build_object('id',v_target.id,'email',v_target.email,'role',CASE WHEN p_make_admin THEN 'ohc_admin' ELSE NULL END));
END;$$;
REVOKE ALL ON FUNCTION ohc_audit_private.change_admin_role(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION ohc_audit_private.change_admin_role(text,boolean) TO authenticated;
CREATE FUNCTION public.ohc_audit_change_admin_role(p_email text,p_make_admin boolean)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT ohc_audit_private.change_admin_role(p_email,p_make_admin); $$;
REVOKE ALL ON FUNCTION public.ohc_audit_change_admin_role(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ohc_audit_change_admin_role(text,boolean) TO authenticated;
COMMIT;
