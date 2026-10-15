CREATE OR REPLACE FUNCTION public.get_engagement_summaries(
  p_portfolio_item_ids uuid[] DEFAULT '{}',
  p_post_ids uuid[] DEFAULT '{}',
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  target_type text,
  target_id uuid,
  comment_count bigint,
  reaction_count bigint,
  user_reacted boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH targets AS (
    SELECT 'portfolio_item'::text AS target_type, unnest(coalesce(p_portfolio_item_ids, '{}'::uuid[])) AS target_id
    UNION ALL
    SELECT 'post'::text AS target_type, unnest(coalesce(p_post_ids, '{}'::uuid[])) AS target_id
  ),
  comment_counts AS (
    SELECT 'portfolio_item'::text AS target_type, c.portfolio_item_id AS target_id, count(*) AS count
    FROM public.comments AS c
    WHERE c.portfolio_item_id = ANY(coalesce(p_portfolio_item_ids, '{}'::uuid[]))
    GROUP BY c.portfolio_item_id
    UNION ALL
    SELECT 'post'::text AS target_type, c.post_id AS target_id, count(*) AS count
    FROM public.comments AS c
    WHERE c.post_id = ANY(coalesce(p_post_ids, '{}'::uuid[]))
    GROUP BY c.post_id
  ),
  reaction_counts AS (
    SELECT 'portfolio_item'::text AS target_type, r.portfolio_item_id AS target_id, count(*) AS count
    FROM public.reactions AS r
    WHERE r.portfolio_item_id = ANY(coalesce(p_portfolio_item_ids, '{}'::uuid[]))
    GROUP BY r.portfolio_item_id
    UNION ALL
    SELECT 'post'::text AS target_type, r.post_id AS target_id, count(*) AS count
    FROM public.reactions AS r
    WHERE r.post_id = ANY(coalesce(p_post_ids, '{}'::uuid[]))
    GROUP BY r.post_id
  ),
  user_reactions AS (
    SELECT 'portfolio_item'::text AS target_type, r.portfolio_item_id AS target_id
    FROM public.reactions AS r
    WHERE p_user_id IS NOT NULL
      AND r.user_id = p_user_id
      AND r.portfolio_item_id = ANY(coalesce(p_portfolio_item_ids, '{}'::uuid[]))
    GROUP BY r.portfolio_item_id
    UNION ALL
    SELECT 'post'::text AS target_type, r.post_id AS target_id
    FROM public.reactions AS r
    WHERE p_user_id IS NOT NULL
      AND r.user_id = p_user_id
      AND r.post_id = ANY(coalesce(p_post_ids, '{}'::uuid[]))
    GROUP BY r.post_id
  )
  SELECT
    t.target_type,
    t.target_id,
    coalesce(cc.count, 0),
    coalesce(rc.count, 0),
    (ur.target_id IS NOT NULL)
  FROM targets AS t
  LEFT JOIN comment_counts AS cc ON cc.target_type = t.target_type AND cc.target_id = t.target_id
  LEFT JOIN reaction_counts AS rc ON rc.target_type = t.target_type AND rc.target_id = t.target_id
  LEFT JOIN user_reactions AS ur ON ur.target_type = t.target_type AND ur.target_id = t.target_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_engagement_summaries(uuid[], uuid[], uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.name, p.slug, p.role, p.school_or_firm, p.bio,
    p.location, p.social_links, p.created_at, p.updated_at,
    p.software_proficiency, p.cv_url, p.instagram_url,
    p.personal_site_url, p.linkedin_url, p.marketing_emails,
    p.avatar_url, p.search_indexable
  FROM public.profiles AS p
  WHERE p.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
