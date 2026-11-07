-- A single Supabase auth user must map to one application profile. This makes
-- auth-trigger creation and server-side recovery safe under concurrent calls.
DO $$
BEGIN
  IF EXISTS (
    SELECT user_id
    FROM public.profiles
    GROUP BY user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one profile per user: duplicate profiles.user_id values exist';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
  ON public.profiles(user_id);

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
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'user'),
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
    id, user_id, name, slug, role, account_type, school_or_firm, bio, location, personal_site_url, social_links
  ) VALUES (
    gen_random_uuid(),
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Community member'),
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
    new.raw_user_meta_data->>'personal_site_url',
    coalesce(new.raw_user_meta_data->'social_links', '{}'::jsonb)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
