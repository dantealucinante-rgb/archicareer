-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('student', 'architect', 'firm');
CREATE TYPE portfolio_category AS ENUM ('residential', 'commercial', 'institutional', 'landscape', 'interior', 'urban', 'academic', 'other');
CREATE TYPE job_type AS ENUM ('internship', 'job', 'competition');
CREATE TYPE job_status AS ENUM ('open', 'closed');

-- 2. Create Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create Tables

-- PROFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    school_or_firm TEXT,
    bio TEXT,
    location TEXT,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_location ON public.profiles(location);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PORTFOLIO ITEMS
CREATE TABLE public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category portfolio_category NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_portfolio_items_profile_id ON public.portfolio_items(profile_id);
CREATE INDEX idx_portfolio_items_category ON public.portfolio_items(category);

CREATE TRIGGER update_portfolio_items_updated_at
BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- JOB LISTINGS
CREATE TABLE public.job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- posted by
    firm_name TEXT NOT NULL,
    title TEXT NOT NULL,
    type job_type NOT NULL,
    description TEXT NOT NULL,
    apply_link_or_email TEXT,
    status job_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_job_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_job_listings_user_id ON public.job_listings(user_id);
CREATE INDEX idx_job_listings_status ON public.job_listings(status);
CREATE INDEX idx_job_listings_type ON public.job_listings(type);

CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- BOOKMARKS
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_listing_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmark_listing FOREIGN KEY (job_listing_id) REFERENCES public.job_listings(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_bookmark UNIQUE (user_id, job_listing_id)
);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);

-- FIRMS (Scaffold and Phase 2)
CREATE TABLE public.firms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_firms_updated_at
BEFORE UPDATE ON public.firms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;


-- 5. Define RLS Policies

-- Public access policies (SELECT)
CREATE POLICY "Allow public read access to active profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to portfolio items" 
ON public.portfolio_items FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to job listings" 
ON public.job_listings FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to firms" 
ON public.firms FOR SELECT 
USING (true);

-- User-specific write policies (INSERT/UPDATE/DELETE)

-- Profiles
CREATE POLICY "Allow users to insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = user_id);

-- Portfolio Items
CREATE POLICY "Allow profile owner to insert portfolio items" 
ON public.portfolio_items FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Allow profile owner to update portfolio items" 
ON public.portfolio_items FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Allow profile owner to delete portfolio items" 
ON public.portfolio_items FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Job Listings
CREATE POLICY "Allow authenticated users to insert job listings" 
ON public.job_listings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Allow poster to update job listings" 
ON public.job_listings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow poster to delete job listings" 
ON public.job_listings FOR DELETE 
USING (auth.uid() = user_id);

-- Bookmarks
CREATE POLICY "Allow users to select their own saved bookmarks" 
ON public.bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own bookmarks" 
ON public.bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own bookmarks" 
ON public.bookmarks FOR DELETE 
USING (auth.uid() = user_id);

-- Firms are currently read-only until an ownership model is added.


-- 6. Trigger for Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  profile_slug text;
  base_slug text;
  slug_counter int := 1;
BEGIN
  -- Extract name or metadata
  base_slug := lower(regexp_replace(
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'user'
    ),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  ));
  
  -- Prevent empty slug
  if base_slug = '' or base_slug = '-' then
    base_slug := 'user';
  end if;

  profile_slug := base_slug;

  -- Ensure uniqueness of slug
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = profile_slug) THEN
      EXIT;
    END IF;
    profile_slug := base_slug || '-' || slug_counter;
    slug_counter := slug_counter + 1;
  END LOOP;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    user_id,
    name,
    slug,
    role,
    school_or_firm,
    bio,
    location,
    social_links
  ) VALUES (
    gen_random_uuid(),
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'Anonymous Architect'
    ),
    profile_slug,
    coalesce(
      CASE 
        WHEN new.raw_user_meta_data->>'role' = 'student' THEN 'student'::user_role 
        WHEN new.raw_user_meta_data->>'role' = 'architect' THEN 'architect'::user_role 
        WHEN new.raw_user_meta_data->>'role' = 'firm' THEN 'firm'::user_role 
        ELSE 'student'::user_role 
      END, 
      'student'::user_role
    ),
    new.raw_user_meta_data->>'school_or_firm',
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'location',
    coalesce(new.raw_user_meta_data->'social_links', '{}'::jsonb)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user() on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
