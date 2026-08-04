-- Application hardening and persisted preferences.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS slug TEXT;

WITH candidates AS (
  SELECT
    id,
    coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'firm-' || left(id::text, 8)) AS base_slug
  FROM public.firms
  WHERE slug IS NULL
), numbered AS (
  SELECT id, base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY id) AS duplicate_number,
    count(*) OVER (PARTITION BY base_slug) AS duplicate_count
  FROM candidates
)
UPDATE public.firms AS firms
SET slug = CASE
  WHEN numbered.duplicate_count = 1 THEN numbered.base_slug
  ELSE numbered.base_slug || '-' || numbered.duplicate_number
END
FROM numbered
WHERE firms.id = numbered.id;

ALTER TABLE public.firms
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'firms_slug_unique'
      AND conrelid = 'public.firms'::regclass
  ) THEN
    ALTER TABLE public.firms
      ADD CONSTRAINT firms_slug_unique UNIQUE (slug);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_firms_slug ON public.firms(slug);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_slug TEXT;
  base_slug TEXT;
  slug_counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'user'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));

  IF base_slug = '' OR base_slug = '-' THEN base_slug := 'user'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(base_slug, 0));
  profile_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = profile_slug) THEN EXIT; END IF;
    profile_slug := base_slug || '-' || slug_counter;
    slug_counter := slug_counter + 1;
  END LOOP;

  INSERT INTO public.profiles (
    id, user_id, name, slug, role, school_or_firm, bio, location, social_links
  ) VALUES (
    gen_random_uuid(),
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous Architect'),
    profile_slug,
    CASE
      WHEN new.raw_user_meta_data->>'role' = 'student' THEN 'student'::user_role
      WHEN new.raw_user_meta_data->>'role' = 'architect' THEN 'architect'::user_role
      WHEN new.raw_user_meta_data->>'role' = 'firm' THEN 'firm'::user_role
      ELSE 'student'::user_role
    END,
    new.raw_user_meta_data->>'school_or_firm',
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'location',
    coalesce(new.raw_user_meta_data->'social_links', '{}'::jsonb)
  );
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Allow authenticated users to insert job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Allow firm users to insert job listings" ON public.job_listings;

CREATE POLICY "Allow firm users to insert job listings"
ON public.job_listings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'firm'
  )
);

-- Role is an authorization attribute; users must not promote their own account
-- through the public Supabase client.
REVOKE UPDATE (role) ON public.profiles FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.job_posting_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.job_posting_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_job_posting_slot(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window TIMESTAMPTZ;
  current_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Not allowed'; END IF;

  INSERT INTO public.job_posting_rate_limits (user_id, window_started_at, post_count)
  VALUES (p_user_id, now(), 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT window_started_at, post_count INTO current_window, current_count
  FROM public.job_posting_rate_limits WHERE user_id = p_user_id FOR UPDATE;

  IF current_window <= now() - interval '1 hour' THEN
    UPDATE public.job_posting_rate_limits SET window_started_at = now(), post_count = 1 WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  IF current_count >= 10 THEN RETURN false; END IF;

  UPDATE public.job_posting_rate_limits SET post_count = post_count + 1 WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_job_posting_slot(UUID) TO authenticated;
