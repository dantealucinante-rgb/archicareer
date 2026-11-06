-- Private, resumable post-registration setup state. Public profile queries
-- never expose this table or its data.
CREATE TABLE public.profile_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step SMALLINT NOT NULL DEFAULT 0 CHECK (onboarding_step BETWEEN 0 AND 5),
  onboarding_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped_steps TEXT[] NOT NULL DEFAULT '{}',
  onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  professional_interests TEXT[] NOT NULL DEFAULT '{}',
  professional_interest_other TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_onboarding_profile_id ON public.profile_onboarding(profile_id);

ALTER TABLE public.profile_onboarding ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.profile_onboarding TO authenticated;

CREATE POLICY "Users can read their own onboarding state"
  ON public.profile_onboarding FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profile_onboarding_updated_at
  BEFORE UPDATE ON public.profile_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_profile_onboarding_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_onboarding (user_id, profile_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_onboarding_state_after_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_onboarding_state();

-- Accounts that existed before this experience shipped keep their current
-- access. Only profiles created after the migration start incomplete.
INSERT INTO public.profile_onboarding (
  user_id,
  profile_id,
  onboarding_completed,
  onboarding_step,
  onboarding_started_at,
  onboarding_completed_at
)
SELECT user_id, id, true, 5, created_at, now()
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
