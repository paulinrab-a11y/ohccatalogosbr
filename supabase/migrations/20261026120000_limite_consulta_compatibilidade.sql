-- OHC Motors
-- Limite de acessos da consulta "serve no meu carro?" (issue #87).
--
-- /api/fit só lê a base de compatibilidade (ohc_find_compatibility_memory) e
-- não grava pedido. Ganha um escopo próprio no limitador, mais folgado que o
-- envio do formulário: 60 consultas por minuto por origem.
--
-- REVERSÃO: recriar a função sem a linha WHEN 'public-fit' (o endpoint passa a
-- responder 503 e o site esconde os selos).

CREATE OR REPLACE FUNCTION public.ohc_audit_consume_limit(p_scope text, p_origin text, p_account text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_limit integer; v_account_limit integer; v_window integer:=900; v_hash text;
 v_hits integer; v_start timestamptz; v_now timestamptz:=clock_timestamp(); v_retry integer:=0;
BEGIN
 CASE p_scope
 WHEN 'otp-send' THEN v_limit:=20;v_account_limit:=5;
 WHEN 'otp-verify' THEN v_limit:=60;v_account_limit:=10;
 WHEN 'public-submit' THEN v_limit:=10;v_account_limit:=10;v_window:=60;
 WHEN 'public-fit' THEN v_limit:=60;v_account_limit:=60;v_window:=60;
 ELSE RAISE EXCEPTION 'invalid_scope'; END CASE;
 IF p_origin IS NULL OR p_origin !~ '^[a-f0-9]{64}$' OR (p_account IS NOT NULL AND p_account !~ '^[a-f0-9]{64}$') THEN RAISE EXCEPTION 'invalid_actor';END IF;
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
 DELETE FROM public.ohc_audit_rate_limits WHERE (scope,actor_hash) IN
  (SELECT scope,actor_hash FROM public.ohc_audit_rate_limits WHERE window_start<v_now-interval '1 day' LIMIT 100);
 RETURN jsonb_build_object('allowed',v_retry=0,'retry_after',v_retry);
END;$function$;
