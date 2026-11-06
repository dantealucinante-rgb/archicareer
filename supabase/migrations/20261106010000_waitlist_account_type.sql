ALTER TABLE public.waitlist_signups
  ADD COLUMN account_type TEXT;

UPDATE public.waitlist_signups
SET account_type = CASE profession_category
  WHEN 'architecture_student' THEN 'student'
  WHEN 'architecture_firm' THEN 'firm'
  ELSE 'professional'
END;

ALTER TABLE public.waitlist_signups
  ALTER COLUMN account_type SET DEFAULT 'professional',
  ALTER COLUMN account_type SET NOT NULL,
  ADD CONSTRAINT waitlist_signups_account_type_check
    CHECK (account_type IN ('student', 'professional', 'firm', 'business'));

CREATE OR REPLACE FUNCTION public.register_waitlist_signup(
  p_full_name TEXT,
  p_email TEXT,
  p_profession_category TEXT,
  p_ip_hash TEXT,
  p_consent BOOLEAN,
  p_account_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  signup_result TEXT;
BEGIN
  IF p_account_type IS NULL OR p_account_type NOT IN ('student', 'professional', 'firm', 'business') THEN
    RAISE EXCEPTION 'Invalid waitlist account type';
  END IF;

  signup_result := public.register_waitlist_signup(
    p_full_name,
    p_email,
    p_profession_category,
    p_ip_hash,
    p_consent
  );

  IF signup_result = 'joined' THEN
    UPDATE public.waitlist_signups
    SET account_type = p_account_type
    WHERE lower(email) = lower(trim(p_email));
  END IF;

  RETURN signup_result;
END;
$$;

REVOKE ALL ON FUNCTION public.register_waitlist_signup(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_waitlist_signup(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO service_role;
