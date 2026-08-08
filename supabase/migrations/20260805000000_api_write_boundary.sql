-- Keep private profile fields private from authenticated direct table reads.
REVOKE SELECT (user_id, marketing_emails)
ON public.profiles
FROM authenticated;

-- All profile and portfolio mutations must go through the server API, which
-- performs validation, ownership checks, and rate limiting.
REVOKE INSERT, UPDATE, DELETE
ON public.profiles, public.portfolio_items, public.portfolio_item_images
FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.release_user_rate_limit(p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_action NOT IN ('profile_update', 'portfolio_write', 'storage_upload') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.user_rate_limits
  SET request_count = greatest(request_count - 1, 0)
  WHERE user_id = auth.uid() AND action = p_action;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.release_user_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_user_rate_limit(TEXT) TO authenticated;
