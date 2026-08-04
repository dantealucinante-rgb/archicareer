-- Avatar support for public profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
