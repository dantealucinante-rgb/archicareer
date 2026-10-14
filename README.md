# ArchiCareer

ArchiCareer is a professional network and opportunity platform for architects, emerging design talent, studios, and companies.

It helps people showcase their work, discover collaborators and employers, and find meaningful career opportunities in architecture and the built-environment industry.

## What you can do

- Create a professional profile and portfolio
- Discover architects, students, studios, and companies
- Follow people and engage with posts
- Browse and apply for jobs
- Publish job listings as a firm or company
- Manage applications and applicant conversations
- Share portfolio work, skills, links, and experience

## Built with

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (Authentication, PostgreSQL, Storage, and Row Level Security)
- Zod

## Getting started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd archicareer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Then add your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project-id.supabase.co/storage/v1/object/public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Keep `SUPABASE_SERVICE_ROLE_KEY` private. It must never be exposed in browser code or committed to version control.

### 4. Set up Supabase

Run the SQL migrations in the `supabase/migrations` directory against your Supabase project. These create the database schema, storage configuration, security policies, rate limits, and supporting functions used by ArchiCareer.

### 5. Seed development data (optional)

```bash
npm run seed
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

```bash
npm run dev      # Start the local development server
npm run build    # Create a production build
npm run start    # Run the production server
npm run lint     # Run ESLint
npm test         # Run security and Supabase integration tests
npm run seed     # Seed development data
```

## Project structure

```text
app/
  (auth)/          Authentication pages
  (dashboard)/     Signed-in profile and settings pages
  (marketing)/     Public marketing pages
  api/             Application API routes
  components/      Reusable UI components
  discover/        People and profile discovery
  firms/           Firm onboarding, profiles, and authentication
  jobs/            Job listings and applications
  onboarding/      Individual profile onboarding

supabase/
  migrations/      Database, storage, and security migrations

scripts/
  seed.mjs         Development seed script

tests/
  Security and Supabase integration tests
```

## Security

ArchiCareer uses Supabase Row Level Security policies and server-side API boundaries to protect profiles, portfolios, job listings, applications, messaging, and uploads.

Before deploying, make sure your Supabase environment variables, migrations, authentication redirects, and storage policies are correctly configured.

## License

This project is private and proprietary unless a license is added.
