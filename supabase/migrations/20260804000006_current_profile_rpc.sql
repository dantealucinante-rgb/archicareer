-- Allow the server to load the signed-in user's private profile fields without
-- granting anonymous clients direct access to user_id or marketing_emails.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles AS p
  WHERE p.user_id = auth.uid();
$$;

REVOKE ALL
ON FUNCTION public.get_my_profile()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_my_profile()
TO authenticated;
