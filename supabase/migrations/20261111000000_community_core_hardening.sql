-- Community creation and post bookmarks.
-- The community tables already exist in the live project; this migration only
-- adds missing uniqueness/atomic-create support and a separate post bookmark
-- relation so the existing job bookmarks remain untouched.

CREATE UNIQUE INDEX IF NOT EXISTS communities_slug_ci_unique
  ON public.communities (lower(slug));

CREATE UNIQUE INDEX IF NOT EXISTS communities_name_ci_unique
  ON public.communities (lower(trim(name)));

CREATE UNIQUE INDEX IF NOT EXISTS community_members_community_user_unique
  ON public.community_members (community_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS reactions_comment_user_unique
  ON public.reactions (comment_id, user_id)
  WHERE comment_id IS NOT NULL;

-- Existing reports already cover platform content. Add the community target
-- kind used by the community report flow without changing existing rows.
ALTER TABLE public.moderation_reports
  DROP CONSTRAINT IF EXISTS moderation_reports_target_type_check;
ALTER TABLE public.moderation_reports
  ADD CONSTRAINT moderation_reports_target_type_check
  CHECK (target_type IN ('profile', 'post', 'comment', 'portfolio_item', 'job_listing', 'community'));

CREATE OR REPLACE FUNCTION public.community_member_counts(p_community_ids UUID[])
RETURNS TABLE (community_id UUID, member_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT cm.community_id, count(*)
  FROM public.community_members cm
  WHERE cm.community_id = ANY(coalesce(p_community_ids, ARRAY[]::UUID[]))
    AND cm.status = 'active'
  GROUP BY cm.community_id;
$$;

REVOKE ALL ON FUNCTION public.community_member_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_member_counts(UUID[]) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.post_bookmarks FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.post_bookmarks TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_bookmarks'
      AND policyname = 'Users read their own post bookmarks'
  ) THEN
    CREATE POLICY "Users read their own post bookmarks"
      ON public.post_bookmarks FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_bookmarks'
      AND policyname = 'Active users bookmark visible posts'
  ) THEN
    CREATE POLICY "Active users bookmark visible posts"
      ON public.post_bookmarks FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() = user_id
        AND public.is_active_account()
        AND EXISTS (
          SELECT 1 FROM public.posts p WHERE p.id = post_bookmarks.post_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_bookmarks'
      AND policyname = 'Users remove their own post bookmarks'
  ) THEN
    CREATE POLICY "Users remove their own post bookmarks"
      ON public.post_bookmarks FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_community(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.communities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  actor UUID := auth.uid();
  created public.communities;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'community_authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_active_account() THEN
    RAISE EXCEPTION 'community_account_inactive' USING ERRCODE = '42501';
  END IF;
  IF char_length(trim(p_name)) NOT BETWEEN 3 AND 50 THEN
    RAISE EXCEPTION 'community_name_length_invalid' USING ERRCODE = '22023';
  END IF;
  IF char_length(trim(p_description)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'community_description_length_invalid' USING ERRCODE = '22023';
  END IF;
  IF p_visibility NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'community_visibility_invalid' USING ERRCODE = '22023';
  END IF;
  IF p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(p_slug) NOT BETWEEN 3 AND 64 THEN
    RAISE EXCEPTION 'community_slug_invalid' USING ERRCODE = '22023';
  END IF;
  IF p_avatar_url IS NOT NULL AND char_length(p_avatar_url) > 2048 THEN
    RAISE EXCEPTION 'community_avatar_url_invalid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.communities (name, slug, description, avatar_url, visibility, owner_id)
  VALUES (trim(p_name), lower(p_slug), trim(p_description), nullif(trim(p_avatar_url), ''), p_visibility, actor)
  RETURNING * INTO created;

  INSERT INTO public.community_members (community_id, user_id, role, status, joined_at)
  VALUES (created.id, actor, 'owner', 'active', now())
  ON CONFLICT (community_id, user_id) DO UPDATE
    SET role = 'owner', status = 'active', joined_at = coalesce(community_members.joined_at, now()), updated_at = now();

  RETURN created;
END;
$$;

REVOKE ALL ON FUNCTION public.create_community(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_community(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.community_moderation_queue(p_community_id UUID)
RETURNS TABLE (
  id UUID, target_type TEXT, target_id UUID, category TEXT, details TEXT,
  status TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.community_can_moderate(p_community_id) THEN
    RAISE EXCEPTION 'community_moderation_access_required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.id, r.target_type, r.target_id, r.category, r.details, r.status, r.created_at
  FROM public.moderation_reports r
  WHERE r.status IN ('open', 'in_review')
    AND (
      (r.target_type = 'community' AND r.target_id = p_community_id)
      OR (r.target_type = 'post' AND EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = r.target_id AND p.community_id = p_community_id
      ))
      OR (r.target_type = 'comment' AND EXISTS (
        SELECT 1 FROM public.comments c JOIN public.posts p ON p.id = c.post_id
        WHERE c.id = r.target_id AND p.community_id = p_community_id
      ))
    )
  ORDER BY r.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_resolve_report(
  p_community_id UUID, p_report_id UUID, p_action TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE actor UUID := auth.uid();
BEGIN
  IF actor IS NULL OR NOT public.community_can_moderate(p_community_id) THEN
    RAISE EXCEPTION 'community_moderation_access_required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('in_review', 'resolved', 'dismissed') OR char_length(coalesce(p_reason, '')) > 1000 THEN
    RAISE EXCEPTION 'community_report_action_invalid' USING ERRCODE = '22023';
  END IF;
  UPDATE public.moderation_reports r
  SET status = p_action,
      decision_reason = nullif(trim(p_reason), ''),
      resolved_by = CASE WHEN p_action IN ('resolved', 'dismissed') THEN actor ELSE NULL END,
      resolved_at = CASE WHEN p_action IN ('resolved', 'dismissed') THEN now() ELSE NULL END
  WHERE r.id = p_report_id
    AND r.status IN ('open', 'in_review')
    AND EXISTS (
      SELECT 1 FROM public.community_moderation_queue(p_community_id) q WHERE q.id = r.id
    );
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_remove_content(
  p_community_id UUID, p_target_type TEXT, p_target_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE actor UUID := auth.uid();
BEGIN
  IF actor IS NULL OR NOT public.community_can_moderate(p_community_id) THEN
    RAISE EXCEPTION 'community_moderation_access_required' USING ERRCODE = '42501';
  END IF;
  IF p_target_type = 'post' THEN
    UPDATE public.posts SET moderation_status = 'removed'
    WHERE id = p_target_id AND community_id = p_community_id AND moderation_status = 'active';
  ELSIF p_target_type = 'comment' THEN
    UPDATE public.comments c SET moderation_status = 'removed'
    WHERE c.id = p_target_id AND c.moderation_status = 'active'
      AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = c.post_id AND p.community_id = p_community_id);
  ELSE
    RAISE EXCEPTION 'community_content_type_invalid' USING ERRCODE = '22023';
  END IF;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_manage_member(
  p_community_id UUID, p_action TEXT, p_target_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  actor UUID := auth.uid();
  target_id UUID := coalesce(p_target_user_id, auth.uid());
  owner_access BOOLEAN;
  moderator_access BOOLEAN;
  community_visibility TEXT;
  target public.community_members;
BEGIN
  IF actor IS NULL OR NOT public.is_active_account() THEN
    RAISE EXCEPTION 'community_authentication_required' USING ERRCODE = '42501';
  END IF;
  SELECT c.visibility INTO community_visibility FROM public.communities c WHERE c.id = p_community_id;
  IF community_visibility IS NULL THEN RAISE EXCEPTION 'community_not_found' USING ERRCODE = 'P0002'; END IF;
  owner_access := public.community_is_owner(p_community_id);
  moderator_access := public.community_can_moderate(p_community_id);

  IF p_action IN ('join', 'request', 'cancel_request', 'leave') THEN
    IF target_id <> actor THEN RAISE EXCEPTION 'community_self_membership_only' USING ERRCODE = '42501'; END IF;
    SELECT * INTO target FROM public.community_members cm WHERE cm.community_id = p_community_id AND cm.user_id = actor FOR UPDATE;
    IF p_action IN ('join', 'request') THEN
      IF (community_visibility = 'private' AND p_action <> 'request') OR (community_visibility = 'public' AND p_action <> 'join') THEN
        RAISE EXCEPTION 'community_membership_action_invalid' USING ERRCODE = '22023';
      END IF;
      IF target.status = 'banned' THEN RAISE EXCEPTION 'community_membership_banned' USING ERRCODE = '42501'; END IF;
      IF target.status = 'active' OR target.status = 'pending' THEN RETURN target.status; END IF;
      INSERT INTO public.community_members (community_id, user_id, role, status, joined_at)
      VALUES (p_community_id, actor, 'member', CASE WHEN community_visibility = 'private' THEN 'pending' ELSE 'active' END,
              CASE WHEN community_visibility = 'private' THEN NULL ELSE now() END)
      ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'member',
        status = EXCLUDED.status, joined_at = EXCLUDED.joined_at, updated_at = now();
      RETURN CASE WHEN community_visibility = 'private' THEN 'pending' ELSE 'active' END;
    ELSIF p_action = 'leave' THEN
      IF owner_access THEN RAISE EXCEPTION 'community_owner_cannot_leave' USING ERRCODE = '42501'; END IF;
      DELETE FROM public.community_members WHERE community_id = p_community_id AND user_id = actor AND status = 'active';
      RETURN NULL;
    ELSE
      DELETE FROM public.community_members WHERE community_id = p_community_id AND user_id = actor AND status = 'pending';
      RETURN NULL;
    END IF;
  END IF;

  IF NOT moderator_access THEN RAISE EXCEPTION 'community_moderation_access_required' USING ERRCODE = '42501'; END IF;
  IF target_id IS NULL OR target_id = (SELECT c.owner_id FROM public.communities c WHERE c.id = p_community_id) THEN
    RAISE EXCEPTION 'community_owner_cannot_be_modified' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO target FROM public.community_members cm WHERE cm.community_id = p_community_id AND cm.user_id = target_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'community_member_not_found' USING ERRCODE = 'P0002'; END IF;
  IF NOT owner_access AND target.role <> 'member' THEN RAISE EXCEPTION 'community_moderator_member_scope' USING ERRCODE = '42501'; END IF;

  IF p_action = 'approve' AND target.status = 'pending' THEN
    UPDATE public.community_members SET status = 'active', joined_at = now(), updated_at = now() WHERE id = target.id;
  ELSIF p_action IN ('reject', 'remove', 'unban') AND ((p_action = 'reject' AND target.status = 'pending') OR (p_action = 'remove' AND target.status = 'active') OR (p_action = 'unban' AND target.status = 'banned')) THEN
    DELETE FROM public.community_members WHERE id = target.id;
  ELSIF p_action = 'ban' AND target.status IN ('active', 'pending') THEN
    UPDATE public.community_members SET status = 'banned', joined_at = NULL, updated_at = now() WHERE id = target.id;
  ELSIF p_action IN ('promote', 'demote') AND owner_access AND target.status = 'active' THEN
    UPDATE public.community_members SET role = CASE WHEN p_action = 'promote' THEN 'moderator' ELSE 'member' END, updated_at = now() WHERE id = target.id;
  ELSE
    RAISE EXCEPTION 'community_member_action_invalid' USING ERRCODE = '22023';
  END IF;
  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.community_update_settings(
  p_community_id UUID, p_name TEXT, p_description TEXT, p_visibility TEXT
)
RETURNS public.communities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE updated public.communities;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_account() OR NOT public.community_is_owner(p_community_id) THEN
    RAISE EXCEPTION 'community_owner_access_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(trim(p_name)) NOT BETWEEN 3 AND 50
    OR char_length(trim(p_description)) NOT BETWEEN 1 AND 500
    OR p_visibility NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'community_settings_invalid' USING ERRCODE = '22023';
  END IF;
  UPDATE public.communities
  SET name = trim(p_name), description = trim(p_description), visibility = p_visibility,
      updated_at = now()
  WHERE id = p_community_id
  RETURNING * INTO updated;
  IF updated.id IS NULL THEN RAISE EXCEPTION 'community_not_found' USING ERRCODE = 'P0002'; END IF;
  RETURN updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.public_profile_communities(p_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, slug TEXT, avatar_url TEXT, role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT c.id, c.name, c.slug, c.avatar_url,
    CASE WHEN c.owner_id = p_user_id THEN 'owner' ELSE cm.role END::TEXT
  FROM public.communities c
  LEFT JOIN public.community_members cm
    ON cm.community_id = c.id AND cm.user_id = p_user_id AND cm.status = 'active'
  WHERE c.visibility = 'public'
    AND (c.owner_id = p_user_id OR cm.user_id IS NOT NULL)
  ORDER BY c.name;
$$;

REVOKE ALL ON FUNCTION public.community_moderation_queue(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_resolve_report(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_remove_content(UUID, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_manage_member(UUID, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_update_settings(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.public_profile_communities(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_moderation_queue(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_resolve_report(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_remove_content(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_manage_member(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_update_settings(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_profile_communities(UUID) TO anon, authenticated;

-- Rollback if needed:
-- DROP FUNCTION IF EXISTS public.create_community(TEXT, TEXT, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.community_moderation_queue(UUID);
-- DROP FUNCTION IF EXISTS public.community_resolve_report(UUID, UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.community_remove_content(UUID, TEXT, UUID);
-- DROP FUNCTION IF EXISTS public.community_manage_member(UUID, TEXT, UUID);
-- DROP FUNCTION IF EXISTS public.community_update_settings(UUID, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.public_profile_communities(UUID);
-- DROP FUNCTION IF EXISTS public.community_member_counts(UUID[]);
-- DROP TABLE IF EXISTS public.post_bookmarks;
-- DROP INDEX IF EXISTS public.community_members_community_user_unique;
-- DROP INDEX IF EXISTS public.communities_name_ci_unique;
-- DROP INDEX IF EXISTS public.communities_slug_ci_unique;
-- DROP INDEX IF EXISTS public.reactions_comment_user_unique;
-- ALTER TABLE public.moderation_reports DROP CONSTRAINT IF EXISTS moderation_reports_target_type_check;
-- ALTER TABLE public.moderation_reports ADD CONSTRAINT moderation_reports_target_type_check CHECK (target_type IN ('profile', 'post', 'comment', 'portfolio_item', 'job_listing'));
