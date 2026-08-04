-- Uploads must go through the server endpoint, which validates file bytes and
-- applies per-user limits before using the service role to write the object.
REVOKE INSERT, UPDATE
ON storage.objects
FROM anon, authenticated;
