-- Expand portfolio and profile data for richer candidate evaluation.

CREATE TYPE portfolio_project_type AS ENUM (
  'residential',
  'commercial',
  'institutional',
  'urban_design',
  'interior',
  'landscape',
  'competition',
  'academic_studio'
);

CREATE TYPE portfolio_item_role AS ENUM ('individual', 'team');
CREATE TYPE portfolio_item_status AS ENUM ('academic', 'professional');

ALTER TABLE public.profiles
  ADD COLUMN software_proficiency TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN cv_url TEXT,
  ADD COLUMN instagram_url TEXT,
  ADD COLUMN personal_site_url TEXT,
  ADD COLUMN linkedin_url TEXT;

ALTER TABLE public.portfolio_items
  ADD COLUMN project_type portfolio_project_type NOT NULL DEFAULT 'academic_studio',
  ADD COLUMN role portfolio_item_role NOT NULL DEFAULT 'individual',
  ADD COLUMN team_contribution TEXT,
  ADD COLUMN software_used TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN year INTEGER,
  ADD COLUMN status portfolio_item_status NOT NULL DEFAULT 'academic',
  ADD COLUMN location TEXT,
  ADD COLUMN process_note VARCHAR(280);

CREATE TABLE public.portfolio_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id UUID NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_item_images_item_order
  ON public.portfolio_item_images(portfolio_item_id, display_order);

INSERT INTO public.portfolio_item_images (portfolio_item_id, image_url, display_order)
SELECT id, image_url, 0
FROM public.portfolio_items
WHERE image_url IS NOT NULL AND image_url <> '';

ALTER TABLE public.portfolio_items
  DROP COLUMN image_url;

ALTER TABLE public.portfolio_item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to portfolio item images"
ON public.portfolio_item_images FOR SELECT
USING (true);

CREATE POLICY "Allow profile owner to insert portfolio item images"
ON public.portfolio_item_images FOR INSERT
WITH CHECK (
  auth.uid() = (
    SELECT p.user_id
    FROM public.portfolio_items i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.id = portfolio_item_id
  )
);

CREATE POLICY "Allow profile owner to update portfolio item images"
ON public.portfolio_item_images FOR UPDATE
USING (
  auth.uid() = (
    SELECT p.user_id
    FROM public.portfolio_items i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.id = portfolio_item_id
  )
)
WITH CHECK (
  auth.uid() = (
    SELECT p.user_id
    FROM public.portfolio_items i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.id = portfolio_item_id
  )
);

CREATE POLICY "Allow profile owner to delete portfolio item images"
ON public.portfolio_item_images FOR DELETE
USING (
  auth.uid() = (
    SELECT p.user_id
    FROM public.portfolio_items i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.id = portfolio_item_id
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-documents',
  'cv-documents',
  true,
  5242880,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on CV documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-documents');

CREATE POLICY "Allow authenticated owner to insert CV documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cv-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated owner to update CV documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cv-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'cv-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated owner to delete CV documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cv-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
