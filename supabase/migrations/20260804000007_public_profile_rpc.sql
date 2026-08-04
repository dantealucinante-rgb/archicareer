-- Public profile lookup that exposes only intentionally public fields and is
-- independent of direct table-column grants/RLS configuration.
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  role user_role,
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
    p.id,
    p.name,
    p.slug,
    p.role,
    p.school_or_firm,
    p.bio,
    p.location,
    p.social_links,
    p.software_proficiency,
    p.cv_url,
    p.instagram_url,
    p.personal_site_url,
    p.linkedin_url,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles AS p
  WHERE p.slug = p_slug;
$$;

REVOKE ALL
ON FUNCTION public.get_public_profile_by_slug(TEXT)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_public_profile_by_slug(TEXT)
TO anon, authenticated;
