CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile_display_order
  ON public.portfolio_items (profile_id, display_order);

CREATE INDEX IF NOT EXISTS idx_job_listings_status_created_at
  ON public.job_listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_location_trgm
  ON public.profiles USING gin (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_school_or_firm_trgm
  ON public.profiles USING gin (school_or_firm gin_trgm_ops);

UPDATE storage.buckets
SET file_size_limit = 3 * 1024 * 1024
WHERE id IN ('portfolio-images', 'post-images');
