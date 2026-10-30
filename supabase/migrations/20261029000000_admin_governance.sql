-- Server-governed administration, moderation and audit records.
-- Bootstrap the first superadmin manually from a trusted SQL session:
-- INSERT INTO public.admin_roles (user_id, role)
-- SELECT id, 'superadmin' FROM auth.users WHERE email = 'trusted-owner@example.com';
-- Do not expose this statement or a role-grant endpoint to ordinary users.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'banned'));

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'removed'));

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'removed'));

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'removed'));

ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'removed'));

CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  reason TEXT,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failed')),
  request_id UUID NOT NULL DEFAULT gen_random_uuid(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'post', 'comment', 'portfolio_item', 'job_listing')),
  target_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (char_length(trim(category)) BETWEEN 2 AND 80),
  details TEXT CHECK (details IS NULL OR char_length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed', 'escalated')),
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason TEXT CHECK (decision_reason IS NULL OR char_length(decision_reason) <= 1000),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status_created ON public.posts(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status_created ON public.comments(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_moderation_status_created ON public.job_listings(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.moderation_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_account()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND account_status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_account() TO authenticated;

-- Public reads retain the existing feature surface but hide moderator-removed content.
DROP POLICY IF EXISTS "Public can read posts" ON public.posts;
CREATE POLICY "Public can read active posts" ON public.posts FOR SELECT USING (moderation_status = 'active');
DROP POLICY IF EXISTS "Public can read comments" ON public.comments;
CREATE POLICY "Public can read active comments" ON public.comments FOR SELECT USING (moderation_status = 'active');
DROP POLICY IF EXISTS "Allow public read access to portfolio items" ON public.portfolio_items;
CREATE POLICY "Allow public read active portfolio items" ON public.portfolio_items FOR SELECT USING (moderation_status = 'active');
DROP POLICY IF EXISTS "Allow public read access to job listings" ON public.job_listings;
CREATE POLICY "Allow public read active job listings" ON public.job_listings FOR SELECT USING (moderation_status = 'active');

-- Suspended and banned accounts cannot mutate platform data through direct clients.
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Active users can create their own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Active users can update their own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_active_account()) WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Active users can delete their own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Active users can create their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Active users can update their own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_active_account()) WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can create their own reactions" ON public.reactions;
CREATE POLICY "Active users can create their own reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
CREATE POLICY "Active users can delete their own reactions" ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can follow as themselves" ON public.follows;
CREATE POLICY "Active users can follow as themselves" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id AND public.is_active_account());
DROP POLICY IF EXISTS "Users can remove their own follows" ON public.follows;
CREATE POLICY "Active users can remove their own follows" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id AND public.is_active_account());
DROP POLICY IF EXISTS "Allow firm users to insert job listings" ON public.job_listings;
CREATE POLICY "Active firm users can insert job listings" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active_account() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'firm'));

CREATE POLICY "Active users can submit moderation reports" ON public.moderation_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id AND public.is_active_account());
CREATE POLICY "Users can read their own moderation reports" ON public.moderation_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

DROP TRIGGER IF EXISTS update_moderation_reports_updated_at ON public.moderation_reports;
CREATE TRIGGER update_moderation_reports_updated_at
BEFORE UPDATE ON public.moderation_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply the same server-enforced account-state gate to existing owner writes.
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Active users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_active_account())
WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Allow profile owner to insert portfolio items" ON public.portfolio_items;
CREATE POLICY "Active users can insert their portfolio items" ON public.portfolio_items FOR INSERT TO authenticated
WITH CHECK (public.is_active_account() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));
DROP POLICY IF EXISTS "Allow profile owner to update portfolio items" ON public.portfolio_items;
CREATE POLICY "Active users can update their portfolio items" ON public.portfolio_items FOR UPDATE TO authenticated
USING (public.is_active_account() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id))
WITH CHECK (public.is_active_account() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));
DROP POLICY IF EXISTS "Allow profile owner to delete portfolio items" ON public.portfolio_items;
CREATE POLICY "Active users can delete their portfolio items" ON public.portfolio_items FOR DELETE TO authenticated
USING (public.is_active_account() AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));
DROP POLICY IF EXISTS "Allow poster to update job listings" ON public.job_listings;
CREATE POLICY "Active users can update their job listings" ON public.job_listings FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_active_account())
WITH CHECK (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Allow poster to delete job listings" ON public.job_listings;
CREATE POLICY "Active users can delete their job listings" ON public.job_listings FOR DELETE TO authenticated
USING (auth.uid() = user_id AND public.is_active_account());
DROP POLICY IF EXISTS "Authenticated users can apply" ON public.applications;
CREATE POLICY "Active users can apply" ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = applicant_id AND public.is_active_account());
DROP POLICY IF EXISTS "Participants can send application messages" ON public.application_messages;
CREATE POLICY "Active participants can send application messages" ON public.application_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND public.is_active_account() AND EXISTS (
  SELECT 1 FROM public.applications JOIN public.job_listings ON job_listings.id = applications.job_listing_id
  WHERE applications.id = application_messages.application_id AND (applications.applicant_id = auth.uid() OR job_listings.user_id = auth.uid())
));

-- Bootstrap superadmin for epraiz121@gmail.com (handles existing or future sign-up)
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'epraiz121@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';

CREATE OR REPLACE FUNCTION public.handle_auto_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email = 'epraiz121@gmail.com' THEN
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (NEW.id, 'superadmin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auto_admin_bootstrap();
