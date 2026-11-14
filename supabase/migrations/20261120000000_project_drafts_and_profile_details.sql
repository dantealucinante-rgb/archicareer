-- Project drafts / publish state.
--
-- Projects previously had no way to be unpublished: the only visibility switch
-- was moderation_status, which is admin-controlled. is_published gives owners a
-- draft state they can save without the project appearing publicly.
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS portfolio_items_public_order_idx
  ON public.portfolio_items (profile_id, display_order)
  WHERE is_published AND moderation_status = 'active';

-- Public reads must not see drafts, but owners must still see their own.
DROP POLICY IF EXISTS "Allow public read active portfolio items" ON public.portfolio_items;
CREATE POLICY "Public can read published portfolio items" ON public.portfolio_items
  FOR SELECT USING (moderation_status = 'active' AND is_published = true);

DROP POLICY IF EXISTS "Owners can read their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Owners can read their own portfolio items" ON public.portfolio_items
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Structured About content (education, experience, affiliations, expertise).
--
-- Onboarding already collects institution/discipline/experience, but only into
-- profile_onboarding.onboarding_data, which is not publicly readable and cannot
-- be edited after onboarding completes. A single validated JSONB document on the
-- profile keeps these CV-shaped lists editable and publishable without three
-- relational tables for free-text entries.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb;
