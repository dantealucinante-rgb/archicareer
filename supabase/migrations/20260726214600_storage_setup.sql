-- Programmatic creation of storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('portfolio-images', 'portfolio-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS client policies on storage.objects

-- Allow public read access to all objects in portfolio-images and avatars buckets
CREATE POLICY "Allow public read access on media assets" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('portfolio-images', 'avatars'));

-- Restrict uploads (INSERT) toauthenticated owners into their own user_id directory
CREATE POLICY "Allow authenticated owner to insert assets" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id IN ('portfolio-images', 'avatars')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Restrict updates (UPDATE) toauthenticated owners in their own directory
CREATE POLICY "Allow authenticated owner to update assets" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id IN ('portfolio-images', 'avatars')
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id IN ('portfolio-images', 'avatars')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Restrict delete (DELETE) toauthenticated owners in their own directory
CREATE POLICY "Allow authenticated owner to delete assets" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id IN ('portfolio-images', 'avatars')
  AND auth.uid()::text = (storage.foldername(name))[1]
);
