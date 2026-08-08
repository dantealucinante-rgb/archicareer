-- V2 community content: posts plus shared comments and reactions.

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posts_content_or_image_required CHECK (
    NULLIF(trim(content), '') IS NOT NULL OR NULLIF(trim(image_url), '') IS NOT NULL
  ),
  CONSTRAINT posts_content_length CHECK (content IS NULL OR char_length(content) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id, created_at DESC);

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comments_one_target CHECK ((portfolio_item_id IS NOT NULL) <> (post_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_comments_portfolio_item ON public.comments(portfolio_item_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at ASC);

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like' CHECK (type = 'like'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reactions_one_target CHECK ((portfolio_item_id IS NOT NULL) <> (post_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_reactions_portfolio_item ON public.reactions(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_portfolio_user
  ON public.reactions(portfolio_item_id, user_id)
  WHERE portfolio_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_post_user
  ON public.reactions(post_id, user_id)
  WHERE post_id IS NOT NULL;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read posts" ON public.posts;
CREATE POLICY "Public can read posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read comments" ON public.comments;
CREATE POLICY "Public can read comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authors or portfolio owners can delete comments" ON public.comments;
CREATE POLICY "Authors or portfolio owners can delete comments" ON public.comments FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.portfolio_items i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.id = comments.portfolio_item_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can read reactions" ON public.reactions;
CREATE POLICY "Public can read reactions" ON public.reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own reactions" ON public.reactions;
CREATE POLICY "Users can create their own reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
CREATE POLICY "Users can delete their own reactions" ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

REVOKE INSERT, UPDATE ON storage.objects FROM anon, authenticated;

DROP POLICY IF EXISTS "Public can read post images" ON storage.objects;
CREATE POLICY "Public can read post images" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
