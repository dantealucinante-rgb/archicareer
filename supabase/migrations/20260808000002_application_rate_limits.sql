-- Rate-limit application and message writes without trusting client-supplied limits.

CREATE OR REPLACE FUNCTION public.consume_user_rate_limit(p_action TEXT, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window TIMESTAMPTZ;
  current_count INTEGER;
  effective_limit INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_action NOT IN ('profile_update', 'portfolio_write', 'storage_upload', 'application_create', 'message_send') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  effective_limit := CASE p_action
    WHEN 'profile_update' THEN 30
    WHEN 'portfolio_write' THEN 60
    WHEN 'storage_upload' THEN 100
    WHEN 'application_create' THEN 20
    WHEN 'message_send' THEN 60
  END;

  INSERT INTO public.user_rate_limits (user_id, action)
  VALUES (auth.uid(), p_action)
  ON CONFLICT (user_id, action) DO NOTHING;

  SELECT window_started_at, request_count
  INTO current_window, current_count
  FROM public.user_rate_limits
  WHERE user_id = auth.uid() AND action = p_action
  FOR UPDATE;

  IF current_window <= now() - interval '1 hour' THEN
    UPDATE public.user_rate_limits
    SET window_started_at = now(), request_count = 1
    WHERE user_id = auth.uid() AND action = p_action;
    RETURN true;
  END IF;

  IF current_count >= effective_limit THEN RETURN false; END IF;

  UPDATE public.user_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = auth.uid() AND action = p_action;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_user_rate_limit(p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_action NOT IN ('profile_update', 'portfolio_write', 'storage_upload', 'application_create', 'message_send') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.user_rate_limits
  SET request_count = greatest(request_count - 1, 0)
  WHERE user_id = auth.uid() AND action = p_action;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_user_rate_limit(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION public.release_user_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_user_rate_limit(TEXT) TO authenticated;
