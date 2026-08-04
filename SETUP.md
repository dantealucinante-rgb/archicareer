# ArchiCareer — Setup Guide

## Prerequisites
- Node.js 20+
- npm 10+
- A Supabase project (create one at https://supabase.com)

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd archicareer
npm install
```

---

## 2. Configure Environment Variables

Copy the example file and fill in your real credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key |

> **IMPORTANT:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Never expose it in client-side code or commit it to version control.

---

## 3. Run Database Migrations

In the Supabase Dashboard → SQL Editor, run each migration file in order:

1. `supabase/migrations/20260726214500_initial_schema.sql`
2. `supabase/migrations/20260726214600_storage_setup.sql`
3. `supabase/migrations/20260726214700_job_listings_soft_preserve.sql`
4. `supabase/migrations/20260726214800_expand_portfolio_profile.sql`
5. `supabase/migrations/20260726214900_harden_firm_rls.sql`
6. `supabase/migrations/20260804000000_application_hardening.sql`
7. `supabase/migrations/20260804000001_runtime_hardening.sql`

> **Storage Note:** The image transform/render endpoint (`/storage/v1/render/`) requires the **Supabase Pro plan**. On the free tier, use the raw object URL instead. See `.env.example` for URL patterns.

---

## 4. Configure Supabase Auth

In the Supabase Dashboard → Authentication:

- Enable **Email (magic link)** under Providers → Email
- (Optional) Enable **Google OAuth** and set your Client ID / Secret
- Set **Site URL** to `http://localhost:3000` for local dev
- Add `http://localhost:3000/auth/callback` to **Redirect URLs**

---

## 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 6. Generate TypeScript Types (after migrations run)

Once the Supabase project is live with migrations applied:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

Then update `types/index.ts` to re-export from `types/supabase.ts` so hand-written interfaces are replaced by the generated source of truth.

---

## 7. Verify Live Setup

Consult `TODO_LIVE_VERIFICATION.md` at the project root for the full checklist of items to confirm once real keys are in hand.
