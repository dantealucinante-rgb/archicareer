-- Allow comments to reply to another comment while preserving the existing
-- portfolio/post target model. Replies cascade when their parent is deleted.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment ON public.comments(parent_comment_id, created_at ASC);
