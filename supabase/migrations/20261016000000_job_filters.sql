ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Nigeria',
  ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'not_disclosed';

ALTER TABLE public.job_listings
  DROP CONSTRAINT IF EXISTS job_listings_pay_type_check;

ALTER TABLE public.job_listings
  ADD CONSTRAINT job_listings_pay_type_check
  CHECK (pay_type IN ('paid', 'unpaid', 'not_disclosed'));

CREATE INDEX IF NOT EXISTS idx_job_listings_location
  ON public.job_listings (location);

CREATE INDEX IF NOT EXISTS idx_job_listings_pay_type
  ON public.job_listings (pay_type);
