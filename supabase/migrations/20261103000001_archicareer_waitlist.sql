CREATE TABLE public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 254),
  profession_category TEXT NOT NULL CHECK (profession_category IN (
    'architecture_student',
    'architect',
    'interior_designer',
    'architectural_visualiser',
    'landscape_architect',
    'engineer',
    'architecture_firm',
    'other'
  )),
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX waitlist_signups_email_unique_idx
  ON public.waitlist_signups (lower(email));

CREATE TABLE public.waitlist_rate_limits (
  ip_hash TEXT PRIMARY KEY CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

CREATE INDEX waitlist_rate_limits_window_started_at_idx
  ON public.waitlist_rate_limits (window_started_at);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.waitlist_signups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.waitlist_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;
GRANT ALL ON public.waitlist_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.register_waitlist_signup(
  p_full_name TEXT,
  p_email TEXT,
  p_profession_category TEXT,
  p_ip_hash TEXT,
  p_consent BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_window TIMESTAMPTZ;
  current_count INTEGER;
  inserted_count INTEGER;
BEGIN
  IF p_consent IS DISTINCT FROM true
    OR char_length(trim(p_full_name)) NOT BETWEEN 2 AND 100
    OR char_length(trim(p_email)) NOT BETWEEN 3 AND 254
    OR position('@' IN p_email) < 2
    OR p_ip_hash !~ '^[a-f0-9]{64}$'
    OR p_profession_category NOT IN (
      'architecture_student', 'architect', 'interior_designer',
      'architectural_visualiser', 'landscape_architect', 'engineer',
      'architecture_firm', 'other'
    ) THEN
    RAISE EXCEPTION 'Invalid waitlist signup';
  END IF;

  DELETE FROM public.waitlist_rate_limits
  WHERE window_started_at < now() - interval '24 hours';

  INSERT INTO public.waitlist_rate_limits (ip_hash, window_started_at, request_count)
  VALUES (p_ip_hash, now(), 0)
  ON CONFLICT (ip_hash) DO NOTHING;

  SELECT window_started_at, request_count
    INTO current_window, current_count
    FROM public.waitlist_rate_limits
    WHERE ip_hash = p_ip_hash
    FOR UPDATE;

  IF current_window <= now() - interval '1 hour' THEN
    UPDATE public.waitlist_rate_limits
      SET window_started_at = now(), request_count = 1
      WHERE ip_hash = p_ip_hash;
  ELSIF current_count >= 5 THEN
    RETURN 'rate_limited';
  ELSE
    UPDATE public.waitlist_rate_limits
      SET request_count = request_count + 1
      WHERE ip_hash = p_ip_hash;
  END IF;

  INSERT INTO public.waitlist_signups (full_name, email, profession_category)
  VALUES (trim(p_full_name), lower(trim(p_email)), p_profession_category)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RETURN 'duplicate';
  END IF;

  RETURN 'joined';
END;
$$;

REVOKE ALL ON FUNCTION public.register_waitlist_signup(TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_waitlist_signup(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;
