-- Membership and purchased-space records are written only by trusted server-side
-- payment integrations. Client sessions may read their own current entitlements.
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'pro_plus')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  current_period_end TIMESTAMPTZ,
  provider TEXT NOT NULL,
  provider_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.portfolio_space_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity SMALLINT NOT NULL CHECK (quantity IN (1, 3, 5, 10)),
  amount_ngn INTEGER NOT NULL CHECK (amount_ngn IN (1500, 3000, 4500, 8000)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  provider TEXT NOT NULL,
  provider_transaction_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT portfolio_space_bundle_price_matches CHECK (
    (quantity = 1 AND amount_ngn = 1500) OR
    (quantity = 3 AND amount_ngn = 3000) OR
    (quantity = 5 AND amount_ngn = 4500) OR
    (quantity = 10 AND amount_ngn = 8000)
  )
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_space_purchases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.billing_subscriptions FROM anon, authenticated;
REVOKE ALL ON public.portfolio_space_purchases FROM anon, authenticated;
GRANT SELECT ON public.billing_subscriptions TO authenticated;
GRANT SELECT ON public.portfolio_space_purchases TO authenticated;
GRANT ALL ON public.billing_subscriptions TO service_role;
GRANT ALL ON public.portfolio_space_purchases TO service_role;

CREATE POLICY "Users can view their own subscription"
ON public.billing_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own portfolio space purchases"
ON public.portfolio_space_purchases FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_billing_subscriptions_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_portfolio_space_purchase_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  should_check BOOLEAN := false;
  already_paid INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    should_check := NEW.status = 'paid';
  ELSE
    should_check := NEW.status = 'paid' AND (
      OLD.status IS DISTINCT FROM NEW.status OR
      OLD.quantity IS DISTINCT FROM NEW.quantity OR
      OLD.user_id IS DISTINCT FROM NEW.user_id
    );
  END IF;

  IF should_check THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT, 7719));
    SELECT COALESCE(SUM(quantity), 0)::INTEGER
      INTO already_paid
      FROM public.portfolio_space_purchases
      WHERE user_id = NEW.user_id AND status = 'paid'
        AND id IS DISTINCT FROM NEW.id;

    IF already_paid + NEW.quantity > 10 THEN
      RAISE EXCEPTION 'portfolio_space_purchase_cap_reached'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_portfolio_space_purchase_cap() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_portfolio_space_purchase_cap
BEFORE INSERT OR UPDATE OF user_id, quantity, status
ON public.portfolio_space_purchases
FOR EACH ROW EXECUTE FUNCTION public.enforce_portfolio_space_purchase_cap();

CREATE OR REPLACE FUNCTION public.enforce_portfolio_space_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  account_user_id UUID;
  active_plan TEXT := 'free';
  included_spaces INTEGER := 3;
  purchased_spaces INTEGER := 0;
  used_spaces INTEGER := 0;
BEGIN
  SELECT user_id INTO account_user_id
    FROM public.profiles
    WHERE id = NEW.profile_id;

  IF account_user_id IS NULL THEN
    RAISE EXCEPTION 'portfolio_profile_not_found' USING ERRCODE = '23503';
  END IF;

  -- Serialize project creation per account so simultaneous requests cannot
  -- race past the same remaining-space count.
  PERFORM pg_advisory_xact_lock(hashtextextended(account_user_id::TEXT, 7720));

  SELECT plan INTO active_plan
    FROM public.billing_subscriptions
    WHERE user_id = account_user_id
      AND status IN ('active', 'canceled')
      AND current_period_end > now()
    LIMIT 1;

  included_spaces := CASE active_plan
    WHEN 'pro' THEN 20
    WHEN 'pro_plus' THEN 50
    ELSE 3
  END;

  SELECT COALESCE(SUM(quantity), 0)::INTEGER INTO purchased_spaces
    FROM public.portfolio_space_purchases
    WHERE user_id = account_user_id AND status = 'paid';

  SELECT COUNT(*)::INTEGER INTO used_spaces
    FROM public.portfolio_items
    WHERE profile_id = NEW.profile_id;

  IF used_spaces >= included_spaces + purchased_spaces THEN
    RAISE EXCEPTION 'portfolio_limit_reached'
      USING ERRCODE = '23514',
        DETAIL = format('This account has reached its limit of %s portfolio spaces.', included_spaces + purchased_spaces);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_portfolio_space_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_portfolio_space_limit
BEFORE INSERT ON public.portfolio_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_portfolio_space_limit();
