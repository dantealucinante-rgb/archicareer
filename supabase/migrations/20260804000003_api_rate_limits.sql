-- Per-user API write limits for profile and portfolio operations.
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

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
  IF auth.uid() IS NULL OR p_action NOT IN ('profile_update', 'portfolio_write', 'storage_upload') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  effective_limit := CASE p_action
    WHEN 'profile_update' THEN 30
    WHEN 'portfolio_write' THEN 60
    WHEN 'storage_upload' THEN 100
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

REVOKE ALL ON FUNCTION public.consume_user_rate_limit(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INTEGER) TO authenticated;

-- These fields are account/internal data and must not be exposed to anonymous clients.
REVOKE SELECT (user_id, marketing_emails)
ON public.profiles
FROM anon;
