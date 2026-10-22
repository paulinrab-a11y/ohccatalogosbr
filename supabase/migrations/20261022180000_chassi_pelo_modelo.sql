-- OHC Motors
-- Compatibilidade pelo modelo e ano (issue #81).
--
-- O site só achava volante quando o cliente informava o chassi ("BMW 320i 2015"
-- caía em análise necessária). Esta migração:
-- 1. cria compatibility_model_chassis: modelo + faixa de anos -> chassi, aprovada
--    pelo proprietário em 22/10/2026 a partir das conversas do WhatsApp;
-- 2. faz ohc_find_compatibility_memory usar essa tabela quando o cliente não
--    informa chassi nem geração. Só infere quando a resposta é única (o modelo
--    mais específico que casa e um único chassi para o ano); senão, nada muda;
-- 3. grava as confirmações da equipe aprovadas no mesmo dia e retira a regra
--    BMW E81 x E60 Pré-Set/2005, que a equipe disse não servir.
--
-- REVERSÃO:
-- 1. Recriar ohc_find_compatibility_memory sem o bloco "Chassi pelo modelo e
--    ano" (versão de 01/09/2026, igual a esta sem v_inferred_chassis).
-- 2. DROP FUNCTION public.ohc_infer_chassis_key(text, text, integer);
--    DROP TABLE public.compatibility_model_chassis;
-- 3. Regras: UPDATE compatibility_rules SET active = false WHERE decision_batch_id
--    = 'a7c1e0f2-5b3d-4c6e-9f81-2d4b6a8c0e22'; e reativar as regras desativadas
--    por esse lote (compatibility_rule_audit, action = 'deactivated').

BEGIN;

CREATE TABLE IF NOT EXISTS public.compatibility_model_chassis (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_brand text NOT NULL,
  brand_key text NOT NULL,
  vehicle_model text NOT NULL,
  model_key text NOT NULL CHECK (length(model_key) BETWEEN 1 AND 120),
  year_from integer NOT NULL CHECK (year_from BETWEEN 1950 AND 2100),
  year_to integer NOT NULL CHECK (year_to BETWEEN 1950 AND 2100),
  chassis text NOT NULL,
  chassis_key text NOT NULL CHECK (length(chassis_key) BETWEEN 1 AND 40),
  source text NOT NULL,
  approved_by text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (year_from <= year_to),
  UNIQUE (brand_key, model_key, year_from, year_to, chassis_key)
);

COMMENT ON TABLE public.compatibility_model_chassis IS
  'Modelo + anos -> chassi, para identificar o chassi quando o cliente não informa. Aprovado pelo proprietário.';

ALTER TABLE public.compatibility_model_chassis ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.compatibility_model_chassis FROM anon, authenticated;

-- The most specific model that matches wins ("c180 coupe" over "c180"). A
-- model typed with extra words still matches ("320i sport gp" -> "320i"), and
-- a space between letter and number is ignored ("c 180" = "c180"), a family
-- name takes a number ("cla 180" -> "cla"), but words are kept whole ("classe e"
-- never matches "cla"). Returns NULL unless exactly
-- one chassis remains.
CREATE OR REPLACE FUNCTION public.ohc_infer_chassis_key(
  p_brand_key text,
  p_model_key text,
  p_year integer
)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO ''
AS $$
  WITH input AS (
    SELECT regexp_replace(coalesce(p_model_key, ''), '([a-z])\s+([0-9])', '\1\2', 'g') AS model
  ), candidates AS (
    SELECT chassis_key,
      regexp_replace(model_key, '([a-z])\s+([0-9])', '\1\2', 'g') AS model
    FROM public.compatibility_model_chassis
    WHERE active
      AND brand_key = p_brand_key
      AND p_year BETWEEN year_from AND year_to
  ), matches AS (
    SELECT candidates.chassis_key, length(candidates.model) AS specificity
    FROM candidates, input
    WHERE input.model = candidates.model
       OR input.model LIKE candidates.model || ' %'
       -- "cla 180" -> "cla180": a family name (ending in a letter, so "m2"
       -- never swallows "m235i") followed by a number.
       OR (candidates.model ~ '[a-z]$'
           AND input.model LIKE candidates.model || '%'
           AND substr(input.model, length(candidates.model) + 1, 1) ~ '[0-9]')
  ), best AS (
    SELECT chassis_key FROM matches
    WHERE specificity = (SELECT max(specificity) FROM matches)
  )
  SELECT CASE WHEN count(DISTINCT chassis_key) = 1 THEN min(chassis_key) END
  FROM best
$$;

REVOKE ALL ON FUNCTION public.ohc_infer_chassis_key(text, text, integer) FROM PUBLIC, anon, authenticated;

INSERT INTO public.compatibility_model_chassis
  (vehicle_brand, brand_key, vehicle_model, model_key, year_from, year_to, chassis, chassis_key, source, approved_by)
SELECT v.brand, k ->> 'brand_key', v.model, k ->> 'model_key', v.y1, v.y2, v.chassis,
  k ->> 'chassis_platform_key', 'whatsapp_conhecimento_20261022', 'Proprietário OHC Motors, 22/10/2026'
FROM (VALUES
  ('BMW', '116i', 2004, 2011, 'E87'), ('BMW', '118i', 2004, 2011, 'E87'),
  ('BMW', '120i', 2004, 2011, 'E87'), ('BMW', '130i', 2004, 2011, 'E87'),
  ('BMW', 'Série 1', 2004, 2011, 'E87'),
  ('BMW', '116i', 2011, 2019, 'F20'), ('BMW', '118i', 2011, 2019, 'F20'),
  ('BMW', '120i', 2011, 2019, 'F20'), ('BMW', '125i', 2011, 2019, 'F20'),
  ('BMW', '118d', 2011, 2019, 'F20'), ('BMW', '120d', 2011, 2019, 'F20'),
  ('BMW', 'Série 1', 2011, 2019, 'F20'),
  ('BMW', '118i', 2020, 2026, 'F40'), ('BMW', '120i', 2020, 2026, 'F40'),
  ('BMW', 'M135i', 2020, 2026, 'F40'), ('BMW', 'Série 1', 2020, 2026, 'F40'),
  ('BMW', '316i', 2005, 2011, 'E90'), ('BMW', '318i', 2005, 2011, 'E90'),
  ('BMW', '320i', 2005, 2011, 'E90'), ('BMW', '325i', 2005, 2011, 'E90'),
  ('BMW', '330i', 2005, 2011, 'E90'), ('BMW', '335i', 2005, 2011, 'E90'),
  ('BMW', '320d', 2005, 2011, 'E90'), ('BMW', 'Série 3', 2005, 2011, 'E90'),
  ('BMW', '316i', 2012, 2019, 'F30'), ('BMW', '318i', 2012, 2019, 'F30'),
  ('BMW', '320i', 2012, 2019, 'F30'), ('BMW', '328i', 2012, 2019, 'F30'),
  ('BMW', '330i', 2012, 2019, 'F30'), ('BMW', '335i', 2012, 2019, 'F30'),
  ('BMW', '340i', 2012, 2019, 'F30'), ('BMW', '320d', 2012, 2019, 'F30'),
  ('BMW', 'Série 3', 2012, 2019, 'F30'),
  ('BMW', '318i', 2019, 2026, 'G20'), ('BMW', '320i', 2019, 2026, 'G20'),
  ('BMW', '330i', 2019, 2026, 'G20'), ('BMW', '330e', 2019, 2026, 'G20'),
  ('BMW', 'M340i', 2019, 2026, 'G20'), ('BMW', '320d', 2019, 2026, 'G20'),
  ('BMW', '330d', 2019, 2026, 'G20'), ('BMW', 'Série 3', 2019, 2026, 'G20'),
  ('BMW', 'X1', 2009, 2015, 'E84'), ('BMW', 'X1', 2016, 2022, 'F48'),
  ('BMW', 'X2', 2018, 2023, 'F39'), ('BMW', 'X5', 2014, 2018, 'F15'),
  ('BMW', 'X6', 2008, 2014, 'E71'), ('BMW', 'X6', 2015, 2019, 'F16'),
  ('BMW', '520i', 2010, 2016, 'F10'), ('BMW', '528i', 2010, 2016, 'F10'),
  ('BMW', '535i', 2010, 2016, 'F10'), ('BMW', '550i', 2010, 2016, 'F10'),
  ('BMW', 'Série 5', 2010, 2016, 'F10'), ('BMW', 'M2', 2016, 2021, 'F87'),
  ('Mercedes-Benz', 'A180', 2013, 2018, 'W176'), ('Mercedes-Benz', 'A200', 2013, 2018, 'W176'),
  ('Mercedes-Benz', 'A250', 2013, 2018, 'W176'), ('Mercedes-Benz', 'Classe A', 2013, 2018, 'W176'),
  ('Mercedes-Benz', 'A200', 2019, 2026, 'W177'), ('Mercedes-Benz', 'A200 Sedan', 2019, 2026, 'W177'),
  ('Mercedes-Benz', 'Classe A', 2019, 2026, 'W177'),
  ('Mercedes-Benz', 'C180', 2008, 2014, 'W204'), ('Mercedes-Benz', 'C200', 2008, 2014, 'W204'),
  ('Mercedes-Benz', 'C250', 2008, 2014, 'W204'), ('Mercedes-Benz', 'C200K', 2008, 2014, 'W204'), ('Mercedes-Benz', 'Classe C', 2008, 2014, 'W204'),
  ('Mercedes-Benz', 'C180', 2015, 2021, 'W205'), ('Mercedes-Benz', 'C200', 2015, 2021, 'W205'),
  ('Mercedes-Benz', 'C250', 2015, 2021, 'W205'), ('Mercedes-Benz', 'C300', 2015, 2021, 'W205'),
  ('Mercedes-Benz', 'Classe C', 2015, 2021, 'W205'),
  ('Mercedes-Benz', 'C180 Coupé', 2016, 2022, 'C205'), ('Mercedes-Benz', 'C200 Coupé', 2016, 2022, 'C205'),
  ('Mercedes-Benz', 'C250 Coupé', 2016, 2022, 'C205'), ('Mercedes-Benz', 'C300 Coupé', 2016, 2022, 'C205'),
  ('Mercedes-Benz', 'CLA', 2014, 2019, 'C117'),
  ('Mercedes-Benz', 'GLA', 2014, 2020, 'X156'),
  ('Mercedes-Benz', 'GLC', 2016, 2022, 'X253'), ('Mercedes-Benz', 'GLC', 2023, 2026, 'X254'),
  ('Mercedes-Benz', 'Classe B', 2012, 2018, 'W246'), ('Mercedes-Benz', 'B180', 2012, 2018, 'W246'),
  ('Mercedes-Benz', 'B200', 2012, 2018, 'W246'),
  ('Mercedes-Benz', 'E250 Conversível', 2010, 2016, 'A207'), ('Mercedes-Benz', 'E250 Cabriolet', 2010, 2016, 'A207'),
  ('Mercedes-Benz', 'E250 Coupé', 2010, 2016, 'C207'),
  ('Audi', 'A3', 2013, 2020, '8V'),
  ('Audi', 'A4', 2008, 2015, 'B8'), ('Audi', 'A4', 2016, 2026, 'B9'),
  ('Mini', 'Cooper', 2014, 2026, 'F56'),
  ('Volkswagen', 'Golf', 1999, 2006, 'Mk4'), ('Volkswagen', 'Golf', 2013, 2020, 'Mk7'),
  ('Volkswagen', 'Jetta', 2011, 2018, 'Mk6'), ('Volkswagen', 'Jetta Variant', 2006, 2010, 'Mk5'),
  ('Volkswagen', 'Polo', 2018, 2026, 'MQB A0')
) AS v(brand, model, y1, y2, chassis)
CROSS JOIN LATERAL (
  SELECT public.ohc_get_vehicle_input_keys(v.brand, v.model, v.y1, NULL, NULL, v.chassis) AS k
) AS keys
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.ohc_find_compatibility_memory(p_vehicle_brand text, p_vehicle_model text, p_vehicle_year integer, p_vehicle_version text DEFAULT NULL::text, p_vehicle_generation text DEFAULT NULL::text, p_chassis_platform text DEFAULT NULL::text, p_motorization text DEFAULT NULL::text, p_include_admin_suggestions boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_keys jsonb := public.ohc_get_vehicle_input_keys(
    p_vehicle_brand,
    p_vehicle_model,
    p_vehicle_year,
    p_vehicle_version,
    p_vehicle_generation,
    p_chassis_platform,
    p_motorization
  );
  v_brand_key text := v_keys ->> 'brand_key';
  v_model_key text := v_keys ->> 'model_key';
  v_version_key text := v_keys ->> 'version_key';
  v_generation_key text := v_keys ->> 'generation_key';
  v_chassis_key text := v_keys ->> 'chassis_platform_key';
  v_motorization_key text := v_keys ->> 'motorization_key';
  v_generation_input text;
  v_chassis_input text;
  v_inferred_chassis text;
  v_results jsonb := '[]'::jsonb;
  v_conflicts jsonb := '[]'::jsonb;
  v_conflict_count integer := 0;
  v_match_priority integer;
  v_identification jsonb;
begin
  if v_brand_key = ''
     or v_model_key = ''
     or p_vehicle_year is null
     or p_vehicle_year < 1950
     or p_vehicle_year > 2100 then
    return jsonb_build_object(
      'matched', false,
      'conflict', false,
      'reason', 'invalid_input',
      'status', 'analise_necessaria',
      'normalized_input', v_keys,
      'results', '[]'::jsonb,
      'suggestions', '[]'::jsonb
    );
  end if;

  v_generation_input := coalesce(nullif(v_generation_key, ''), nullif(v_chassis_key, ''), '');
  v_chassis_input := coalesce(nullif(v_chassis_key, ''), nullif(v_generation_key, ''), '');

  -- Chassi pelo modelo e ano: only when the customer gave neither chassis nor
  -- generation, and only when the model and year point to a single chassis.
  if v_generation_input = '' and v_chassis_input = '' then
    v_inferred_chassis := public.ohc_infer_chassis_key(v_brand_key, v_model_key, p_vehicle_year);
    if v_inferred_chassis is not null then
      v_generation_input := v_inferred_chassis;
      v_chassis_input := v_inferred_chassis;
      v_keys := v_keys || jsonb_build_object('inferred_chassis_key', v_inferred_chassis);
    end if;
  end if;

  with base_candidates as (
    select
      rule.id as rule_id,
      rule.decision_batch_id,
      rule.status,
      rule.rule_scope,
      rule.scope_explicitly_approved,
      rule.public_notes,
      rule.installation_conditions,
      rule.rule_version,
      rule.updated_at,
      product.id as product_id,
      product.sku,
      product.marca as product_brand,
      product.nome_produto as product_name,
      product.slug,
      product.imagem_principal as product_image,
      profile.vehicle_model_key = v_model_key
        or exists (
          select 1
          from public.compatibility_vehicle_aliases as alias
          where alias.active
            and alias.vehicle_profile_id = profile.id
            and alias.alias_kind in ('model', 'manual')
            and alias.alias_key = v_model_key
        ) as model_matches,
      profile.version_key,
      profile.generation_key,
      profile.chassis_platform_key,
      profile.motorization_key
    from public.compatibility_rules as rule
    join public.compatibility_vehicle_profiles as profile
      on profile.id = rule.vehicle_profile_id
     and profile.active
    join public.catalog_products as product
      on product.id = rule.product_id
     and product.ativo
    where rule.active
      and rule.status in ('compativel', 'incompativel', 'compativel_com_condicoes')
      and profile.vehicle_brand_key = v_brand_key
      and p_vehicle_year between rule.year_from and rule.year_to
      and p_vehicle_year between profile.year_from and profile.year_to
  ), scoped_candidates as (
    select
      base_candidates.*,
      case rule_scope
        when 'exact_vehicle_version' then 1
        when 'model_year_range' then 2
        when 'generation' then 3
        when 'chassis_platform' then 4
      end as match_priority
    from base_candidates
    where case rule_scope
      when 'exact_vehicle_version' then
        model_matches
        and version_key <> ''
        and version_key = v_version_key
        and (generation_key = '' or generation_key = v_generation_input)
        and (chassis_platform_key = '' or chassis_platform_key = v_chassis_input)
        and (motorization_key = '' or motorization_key = v_motorization_key)
      when 'model_year_range' then
        model_matches
        and (version_key = '' or version_key = v_version_key)
        and (generation_key = '' or generation_key = v_generation_input)
        and (chassis_platform_key = '' or chassis_platform_key = v_chassis_input)
        and (motorization_key = '' or motorization_key = v_motorization_key)
      when 'generation' then
        scope_explicitly_approved
        and model_matches
        and v_generation_input <> ''
        and generation_key = v_generation_input
      when 'chassis_platform' then
        scope_explicitly_approved
        and v_chassis_input <> ''
        and chassis_platform_key = v_chassis_input
      else false
    end
  ), ranked as (
    select
      scoped_candidates.*,
      min(match_priority) over (partition by product_id) as best_priority
    from scoped_candidates
  ), best as (
    select *
    from ranked
    where match_priority = best_priority
  ), summaries as (
    select
      product_id,
      sku,
      product_brand,
      product_name,
      slug,
      product_image,
      min(match_priority) as match_priority,
      count(distinct status)::integer as status_count,
      (array_agg(status order by updated_at desc, rule_id))[1] as status,
      (array_agg(rule_id order by updated_at desc, rule_id))[1] as rule_id,
      (array_agg(decision_batch_id order by updated_at desc, rule_id))[1] as decision_batch_id,
      (array_agg(rule_scope order by updated_at desc, rule_id))[1] as rule_scope,
      (array_agg(public_notes order by updated_at desc, rule_id))[1] as public_notes,
      (array_agg(installation_conditions order by updated_at desc, rule_id))[1] as installation_conditions,
      (array_agg(rule_version order by updated_at desc, rule_id))[1] as rule_version,
      array_agg(rule_id order by updated_at desc, rule_id) as rule_ids
    from best
    group by product_id, sku, product_brand, product_name, slug, product_image
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id,
      'sku', sku,
      'brand', product_brand,
      'name', product_name,
      'slug', slug,
      'image', product_image,
      'status', status,
      'result_label', case status
        when 'compativel' then 'Compatível'
        when 'incompativel' then 'Não compatível'
        when 'compativel_com_condicoes' then 'Compatível com condições'
      end,
      'rule_id', rule_id,
      'decision_batch_id', decision_batch_id,
      'rule_scope', rule_scope,
      'match_priority', match_priority,
      'public_notes', public_notes,
      'installation_conditions', installation_conditions,
      'rule_version', rule_version
    ) order by match_priority, product_brand, product_name, sku)
      filter (where status_count = 1), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'product_id', product_id,
      'sku', sku,
      'name', product_name,
      'rule_ids', to_jsonb(rule_ids),
      'requires_admin_confirmation', true
    )) filter (where status_count > 1), '[]'::jsonb),
    (count(*) filter (where status_count > 1))::integer,
    min(match_priority)
  into v_results, v_conflicts, v_conflict_count, v_match_priority
  from summaries;

  if coalesce(v_conflict_count, 0) > 0 then
    return jsonb_build_object(
      'matched', false,
      'conflict', true,
      'reason', 'rule_conflict',
      'status', 'analise_necessaria',
      'normalized_input', v_keys,
      'match_priority', v_match_priority,
      'results', '[]'::jsonb,
      'conflicts', v_conflicts,
      'suggestions', '[]'::jsonb
    );
  end if;

  if jsonb_array_length(v_results) > 0 then
    return jsonb_build_object(
      'matched', true,
      'conflict', false,
      'reason', 'approved_rule',
      'status', 'regra_aprovada',
      'normalized_input', v_keys,
      'match_priority', v_match_priority,
      'results', v_results,
      'conflicts', '[]'::jsonb,
      'suggestions', '[]'::jsonb
    );
  end if;

  v_identification := public.ohc_identify_vehicle_profile(
    p_vehicle_brand,
    p_vehicle_model,
    p_vehicle_year,
    p_vehicle_version,
    p_vehicle_generation,
    p_chassis_platform,
    p_motorization,
    coalesce(p_include_admin_suggestions, false)
  );

  return jsonb_build_object(
    'matched', false,
    'conflict', false,
    'reason', 'analysis_required',
    'status', 'analise_necessaria',
    'normalized_input', v_keys,
    'match_priority', null,
    'results', '[]'::jsonb,
    'conflicts', '[]'::jsonb,
    'suggestions', case
      when coalesce(p_include_admin_suggestions, false)
        then coalesce(v_identification -> 'suggestions', '[]'::jsonb)
      else '[]'::jsonb
    end
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Confirmações da equipe (WhatsApp), aprovadas pelo proprietário em 22/10/2026.
-- ---------------------------------------------------------------------------

-- Chassis profiles the team confirmations need (same shape as the BMW ones).
INSERT INTO public.compatibility_vehicle_profiles
  (vehicle_brand, vehicle_brand_key, vehicle_model, vehicle_model_key, year_from, year_to,
   chassis_platform, chassis_platform_key, normalized_key)
SELECT v.brand, k ->> 'brand_key', v.model, k ->> 'model_key', v.y1, v.y2, v.chassis,
  coalesce(k ->> 'chassis_platform_key', ''),
  concat_ws('|', k ->> 'brand_key', k ->> 'model_key', v.y1 || '-' || v.y2, '', '',
    coalesce(k ->> 'chassis_platform_key', ''), '')
FROM (VALUES
  ('Volkswagen', 'Aplicação por chassi', 1950, 2100, 'Mk4'),
  ('Mercedes-Benz', 'Aplicação por chassi', 1950, 2100, 'C205'),
  ('Volkswagen', 'Amarok', 2017, 2026, NULL)
) AS v(brand, model, y1, y2, chassis)
CROSS JOIN LATERAL (
  SELECT public.ohc_get_vehicle_input_keys(v.brand, v.model, v.y1, NULL, NULL, v.chassis) AS k
) AS keys
ON CONFLICT (normalized_key) DO NOTHING;

-- Retired by this batch: E81 x E60 Pré-Set (team: not compatible) and the
-- Amarok 2019 x Golf GTI 2015 rule that said plug and play.
WITH retired AS (
  UPDATE public.compatibility_rules AS rule
     SET active = false, updated_at = now()
    FROM public.compatibility_vehicle_profiles AS profile
   WHERE profile.id = rule.vehicle_profile_id
     AND rule.active
     AND (
       (rule.product_sku = '1.02.B02.00058' AND profile.chassis_platform_key = 'e81')
       OR (rule.product_sku = '1.01.D01.00009' AND profile.vehicle_model_key = 'amarok')
     )
  RETURNING rule.id, rule.status, rule.product_sku, rule.rule_version, to_jsonb(rule) AS snapshot
)
INSERT INTO public.compatibility_rule_audit
  (rule_id, action, previous_status, new_status, actor, details, decision_batch_id, change_reason, previous_rule_version)
SELECT id, 'deactivated', status, NULL, 'Proprietário OHC Motors (equipe via WhatsApp)',
  jsonb_build_object('source', 'whatsapp_conhecimento_20261022', 'product_sku', product_sku, 'rule_snapshot', snapshot),
  'a7c1e0f2-5b3d-4c6e-9f81-2d4b6a8c0e22',
  CASE product_sku
    WHEN '1.02.B02.00058' THEN 'Equipe disse que não é compatível com o BMW 118i E81; o proprietário mandou seguir a equipe.'
    ELSE 'Equipe: volante Golf GTI na Amarok não é plug and play; substituída por regra com condições.'
  END,
  rule_version
FROM retired;

WITH decided(sku, brand, model, chassis, y1, y2, status, scope, public_notes, conditions, evidence) AS (
  VALUES
    ('1.02.B02.00003', 'BMW', 'Aplicação por chassi', 'G20', 1950, 2100, 'incompativel', 'chassis_platform',
     'Não serve no chassi G20: é um modelo exclusivo para BMW M5.', NULL,
     'Equipe, conversa de BMW 320i 2024 (G20): "Modelo exclusivo para M5".'),
    ('1.02.D01.00009', 'Volkswagen', 'Aplicação por chassi', 'Mk4', 1950, 2100, 'incompativel', 'chassis_platform',
     'Não é compatível com o Golf Mk4; serviria só como peça estética.', NULL,
     'Equipe, conversa de Golf Mk4 2002: não é compatível, só por estética.'),
    ('1.02.D01.00009', 'Volkswagen', 'Amarok', NULL, 2017, 2026, 'compativel_com_condicoes', 'model_year_range',
     'Instala na Amarok, mas não é plug and play.',
     'Exige codificação feita por especialista e módulo vendido pelo instalador.',
     'Equipe, 14/10/2026 (Amarok 2023): "ele tem que fazer a codificação / ele não é plug in play".'),
    ('1.01.D01.00009', 'Volkswagen', 'Amarok', NULL, 2017, 2026, 'compativel_com_condicoes', 'model_year_range',
     'Instala na Amarok, mas não é plug and play.',
     'Exige codificação feita por especialista e módulo vendido pelo instalador.',
     'Equipe, 14/10/2026: volante Golf GTI na Amarok exige codificação; substitui a regra de 2019 sem condições.'),
    ('1.02.B01.00035', 'Mercedes-Benz', 'Aplicação por chassi', 'C205', 1950, 2100, 'compativel', 'chassis_platform',
     'Compatibilidade confirmada pela equipe OHC para o chassi C205 (volante original de 4 fios, linha CAN).', NULL,
     'Equipe, conversa de C250 Coupé 2016 (C205): volante original de 4 fios indica os modelos CAN.')
), resolved AS (
  SELECT d.*, k ->> 'brand_key' AS brand_key, k ->> 'model_key' AS model_key,
    coalesce(k ->> 'chassis_platform_key', '') AS chassis_key,
    product.id AS product_id,
    profile.id AS profile_id
  FROM decided AS d
  CROSS JOIN LATERAL (
    SELECT public.ohc_get_vehicle_input_keys(d.brand, d.model, d.y1, NULL, NULL, d.chassis) AS k
  ) AS keys
  JOIN public.catalog_products AS product ON product.sku = d.sku
  JOIN public.compatibility_vehicle_profiles AS profile
    ON profile.vehicle_brand_key = k ->> 'brand_key'
   AND profile.vehicle_model_key = k ->> 'model_key'
   AND profile.chassis_platform_key = coalesce(k ->> 'chassis_platform_key', '')
   AND profile.year_from = d.y1
   AND profile.year_to = d.y2
   AND profile.active
), created AS (
  INSERT INTO public.compatibility_rules
    (product_sku, product_sku_key, vehicle_brand, vehicle_brand_key, vehicle_model, vehicle_model_key,
     generation_chassis, generation_key, year_from, year_to, status, admin_notes, reviewed_by,
     vehicle_profile_id, product_id, decision_batch_id, rule_scope, scope_explicitly_approved,
     public_notes, internal_notes, installation_conditions, confidence_level, confirmed_by, confirmed_at)
  SELECT sku, lower(regexp_replace(sku, '[^A-Za-z0-9]+', ' ', 'g')), brand, brand_key, model, model_key,
    chassis, chassis_key, y1, y2, status, 'Conhecimento do WhatsApp aprovado em 22/10/2026.',
    'Proprietário OHC Motors, 22/10/2026',
    profile_id, product_id, 'a7c1e0f2-5b3d-4c6e-9f81-2d4b6a8c0e22', scope, scope = 'chassis_platform',
    public_notes, evidence, conditions, 'confirmed', 'Equipe OHC Motors (WhatsApp)', now()
  FROM resolved
  RETURNING id, status, product_sku
)
INSERT INTO public.compatibility_rule_audit
  (rule_id, action, previous_status, new_status, actor, details, decision_batch_id, change_reason, new_rule_version)
SELECT id, 'created', NULL, status, 'Proprietário OHC Motors (equipe via WhatsApp)',
  jsonb_build_object('source', 'whatsapp_conhecimento_20261022', 'product_sku', product_sku),
  'a7c1e0f2-5b3d-4c6e-9f81-2d4b6a8c0e22',
  'Confirmação da equipe no WhatsApp, aprovada pelo proprietário em 22/10/2026.', 1
FROM created;

COMMIT;
