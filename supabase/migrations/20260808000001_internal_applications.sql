-- Internal applications and private application conversations.

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_note TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'shortlisted', 'interview', 'declined', 'hired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_listing_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_listing_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_messages_application ON public.application_messages(application_id, created_at ASC);

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants and firms can read applications" ON public.applications;
CREATE POLICY "Applicants and firms can read applications"
ON public.applications FOR SELECT TO authenticated
USING (
  auth.uid() = applicant_id
  OR EXISTS (
    SELECT 1 FROM public.job_listings
    WHERE job_listings.id = applications.job_listing_id
      AND job_listings.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can apply" ON public.applications;
CREATE POLICY "Authenticated users can apply"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Firms can update application status" ON public.applications;
CREATE POLICY "Firms can update application status"
ON public.applications FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.job_listings
  WHERE job_listings.id = applications.job_listing_id
    AND job_listings.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.job_listings
  WHERE job_listings.id = applications.job_listing_id
    AND job_listings.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Participants can read application messages" ON public.application_messages;
CREATE POLICY "Participants can read application messages"
ON public.application_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.applications
  JOIN public.job_listings ON job_listings.id = applications.job_listing_id
  WHERE applications.id = application_messages.application_id
    AND (applications.applicant_id = auth.uid() OR job_listings.user_id = auth.uid())
));

DROP POLICY IF EXISTS "Participants can send application messages" ON public.application_messages;
CREATE POLICY "Participants can send application messages"
ON public.application_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.applications
    JOIN public.job_listings ON job_listings.id = applications.job_listing_id
    WHERE applications.id = application_messages.application_id
      AND (applications.applicant_id = auth.uid() OR job_listings.user_id = auth.uid())
  )
);
