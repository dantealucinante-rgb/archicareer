-- Runtime hardening for the application-level fixes.

CREATE OR REPLACE FUNCTION public.close_orphaned_listings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.status := 'closed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS close_orphaned_job_listings
ON public.job_listings;

CREATE TRIGGER close_orphaned_job_listings
BEFORE UPDATE OF user_id ON public.job_listings
FOR EACH ROW
WHEN (OLD.user_id IS NOT NULL AND NEW.user_id IS NULL)
EXECUTE FUNCTION public.close_orphaned_listings();

REVOKE SELECT (user_id)
ON public.job_listings
FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.release_job_posting_slot(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.job_posting_rate_limits
  SET post_count = greatest(post_count - 1, 0)
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE
ON FUNCTION public.release_job_posting_slot(UUID)
TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_job_bookmark(p_job_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  existing_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(current_user_id::text || ':' || p_job_listing_id::text, 0)
  );

  SELECT id
  INTO existing_id
  FROM public.bookmarks
  WHERE user_id = current_user_id
    AND job_listing_id = p_job_listing_id
  FOR UPDATE;

  IF existing_id IS NOT NULL THEN
    DELETE FROM public.bookmarks WHERE id = existing_id;
    RETURN false;
  END IF;

  INSERT INTO public.bookmarks (user_id, job_listing_id)
  VALUES (current_user_id, p_job_listing_id);
  RETURN true;
END;
$$;

GRANT EXECUTE
ON FUNCTION public.toggle_job_bookmark(UUID)
TO authenticated;
