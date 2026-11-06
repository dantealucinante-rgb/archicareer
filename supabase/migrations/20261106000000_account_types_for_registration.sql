-- Preserve the existing authorization roles while recording the selected
-- registration type separately. The old role enum is still used by current
-- firm and individual permission checks.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT;

UPDATE public.profiles
SET account_type = CASE role
  WHEN 'student' THEN 'student'
  WHEN 'architect' THEN 'professional'
  WHEN 'firm' THEN 'firm'
END
WHERE account_type IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN account_type SET DEFAULT 'student',
  ALTER COLUMN account_type SET NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('student', 'professional', 'firm', 'business'));

CREATE OR REPLACE FUNCTION public.normalize_profile_account_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type IS NULL
    OR (TG_OP = 'INSERT' AND NEW.account_type = 'student' AND NEW.role <> 'student')
    OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NEW.account_type IS NOT DISTINCT FROM OLD.account_type)
  THEN
    NEW.account_type := CASE NEW.role
      WHEN 'student' THEN 'student'
      WHEN 'architect' THEN 'professional'
      WHEN 'firm' THEN 'firm'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_profile_account_type
BEFORE INSERT OR UPDATE OF role, account_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_account_type();

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
  selected_type TEXT;
BEGIN
  selected_type := CASE
    WHEN new.raw_user_meta_data->>'account_type' IN ('student', 'professional', 'firm', 'business')
      THEN new.raw_user_meta_data->>'account_type'
    WHEN new.raw_user_meta_data->>'role' = 'architect' THEN 'professional'
    WHEN new.raw_user_meta_data->>'role' = 'firm' THEN 'firm'
    ELSE 'student'
  END;

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
    id, user_id, name, slug, role, account_type, school_or_firm, bio, location, social_links
  ) VALUES (
    gen_random_uuid(),
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Community member'),
    profile_slug,
    CASE
      WHEN selected_type = 'student' THEN 'student'::user_role
      WHEN selected_type = 'professional' THEN 'architect'::user_role
      ELSE 'firm'::user_role
    END,
    selected_type,
    new.raw_user_meta_data->>'school_or_firm',
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'location',
    coalesce(new.raw_user_meta_data->'social_links', '{}'::jsonb)
  );
  RETURN NEW;
END;
$$;

-- Keep the existing private profile RPC compatible with the extended row.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles AS p
  WHERE p.user_id = auth.uid();
$$;

-- Public profile lookup exposes the account type, which is not a secret, and
-- continues to omit private auth metadata and registration details.
DROP FUNCTION public.get_public_profile_by_slug(TEXT);

CREATE FUNCTION public.get_public_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  role user_role,
  account_type TEXT,
  school_or_firm TEXT,
  bio TEXT,
  location TEXT,
  social_links JSONB,
  software_proficiency TEXT[],
  cv_url TEXT,
  instagram_url TEXT,
  personal_site_url TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.slug, p.role, p.account_type, p.school_or_firm,
    p.bio, p.location, p.social_links, p.software_proficiency, p.cv_url,
    p.personal_site_url, p.instagram_url, p.linkedin_url, p.avatar_url,
    p.created_at, p.updated_at
  FROM public.profiles AS p
  WHERE p.slug = p_slug
    AND p.search_indexable = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_by_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(TEXT) TO anon, authenticated;
