CREATE OR REPLACE FUNCTION public.normalize_oem_code(raw_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(coalesce(raw_code, ''), '[^A-Za-z0-9]+', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.upsert_oem_vehicle_links(p_links jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saved_count integer := 0;
BEGIN
  IF p_links IS NULL OR jsonb_typeof(p_links) <> 'array' THEN
    RETURN 0;
  END IF;

  WITH parsed AS (
    SELECT
      trim(elem->>'oem_code') AS oem_code,
      public.normalize_oem_code(elem->>'oem_code') AS oem_code_norm,
      (elem->>'vehicle_id')::bigint AS vehicle_id,
      coalesce(nullif(trim(elem->>'source'), ''), 'seller_manual') AS source,
      nullif(trim(elem->>'notes'), '') AS notes
    FROM jsonb_array_elements(p_links) AS elem
    WHERE nullif(trim(elem->>'oem_code'), '') IS NOT NULL
      AND (elem->>'vehicle_id') ~ '^[0-9]+$'
  ),
  deduped AS (
    SELECT DISTINCT ON (p.oem_code_norm, p.vehicle_id)
      p.oem_code,
      p.oem_code_norm,
      p.vehicle_id,
      p.source,
      p.notes
    FROM parsed p
    INNER JOIN public.vehicles v ON v.id = p.vehicle_id
    WHERE length(p.oem_code_norm) >= 2
    ORDER BY p.oem_code_norm, p.vehicle_id
  ),
  upserted AS (
    INSERT INTO public.oem_vehicle_compatibility (
      oem_code,
      oem_code_norm,
      vehicle_id,
      source,
      notes,
      verified,
      created_by
    )
    SELECT
      d.oem_code,
      d.oem_code_norm,
      d.vehicle_id,
      d.source,
      d.notes,
      true,
      auth.uid()
    FROM deduped d
    ON CONFLICT (oem_code_norm, vehicle_id)
    DO UPDATE SET
      oem_code = EXCLUDED.oem_code,
      source = EXCLUDED.source,
      notes = coalesce(EXCLUDED.notes, public.oem_vehicle_compatibility.notes),
      verified = true,
      updated_at = now()
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_saved_count FROM upserted;

  RETURN coalesce(v_saved_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_oem_vehicle_links(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_oem_codes_batch(text[]) TO anon, authenticated;

ALTER TABLE public.oem_vehicle_compatibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lettura pubblica oem_vehicle_compatibility" ON public.oem_vehicle_compatibility;
CREATE POLICY "Lettura pubblica oem_vehicle_compatibility"
  ON public.oem_vehicle_compatibility FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Scrittura sito oem_vehicle_compatibility" ON public.oem_vehicle_compatibility;
CREATE POLICY "Scrittura sito oem_vehicle_compatibility"
  ON public.oem_vehicle_compatibility FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Aggiornamento sito oem_vehicle_compatibility" ON public.oem_vehicle_compatibility;
CREATE POLICY "Aggiornamento sito oem_vehicle_compatibility"
  ON public.oem_vehicle_compatibility FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Rimozione sito oem_vehicle_compatibility" ON public.oem_vehicle_compatibility;
CREATE POLICY "Rimozione sito oem_vehicle_compatibility"
  ON public.oem_vehicle_compatibility FOR DELETE
  TO anon, authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';