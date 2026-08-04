# TODO_LIVE_VERIFICATION.md
# ArchiCareer — Live Verification Checklist

Everything in this file must be confirmed against a real Supabase project
once credentials are available. Items are grouped by category.

---

## 🔑 1. Authentication & Session

- [ ] Magic link email flow works end-to-end (send, receive, click, land on dashboard)
- [ ] Google OAuth sign-in works and creates a profile via trigger
- [ ] `on_auth_user_created` trigger fires on signup and inserts a row into `public.profiles`
- [ ] Slug deduplication is correct — register two users named "John Smith", confirm slugs are `john-smith` and `john-smith-1`
- [ ] Session cookie is correctly set and refreshed by middleware (`lib/supabase/middleware.ts`)
- [ ] Logged-out redirect works on protected dashboard routes

---

## 🗄️ 2. Database — RLS (Replace simulated tests with real authenticated requests)

The current RLS test at `tests/rls-mock-test.js` is a pure JavaScript simulation.
Once a project exists, replace it with real Supabase client calls using two distinct test user sessions.

- [ ] Confirm anonymous `SELECT` on `profiles` returns rows (public read)
- [ ] Confirm anonymous `INSERT` on `profiles` is rejected (RLS)
- [ ] Confirm authenticated user can only `UPDATE` their own row in `profiles`
- [ ] Attempt to `UPDATE` another user's `profiles` row — confirm 0 rows affected, no error leakage
- [ ] Confirm `portfolio_items` ownership check via `profile_id → profiles.user_id` (two-hop ownership) works in SQL
- [ ] Confirm `bookmarks` are invisible to other users (`SELECT` returns only caller's own rows)
- [ ] Confirm anonymous users cannot `INSERT` into `job_listings`

---

## 🧱 3. Schema & Migration Correctness

- [ ] Apply all seven migration files in order and confirm no SQL errors:
  1. `20260726214500_initial_schema.sql`
  2. `20260726214600_storage_setup.sql`
  3. `20260726214700_job_listings_soft_preserve.sql`
  4. `20260726214800_expand_portfolio_profile.sql`
  5. `20260726214900_harden_firm_rls.sql`
  6. `20260804000000_application_hardening.sql`
  7. `20260804000001_runtime_hardening.sql`
- [ ] Confirm `updated_at` is automatically updated on row update for: `profiles`, `portfolio_items`, `job_listings`, `firms`

### Soft-Delete Decision (confirmed in migration 20260726214700)
**Decision:** `job_listings.user_id` uses `ON DELETE SET NULL` instead of `ON DELETE CASCADE`.
When a firm's account is deleted, their postings are preserved with `user_id = NULL` and `status = 'closed'`, so saved bookmarks and candidates' history remain intact.
This was chosen over hard-delete and over adding a separate `archived` boolean column — the existing `status` enum covers the closed state adequately.

- [ ] Delete a test user account and confirm their `job_listings` rows persist with `user_id = NULL` and `status = 'closed'`
- [ ] Confirm the `close_orphaned_job_listings` trigger closes preserved listings after account deletion

---

## 📦 4. TypeScript Types — Replace Hand-Written Interfaces

Current interfaces in `types/index.ts` are hand-written to match the migration schema.
Once the project is live and migrations are applied, replace them with generated types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

Then update `types/index.ts` imports to pull from `types/supabase.ts`.

- [ ] Run `supabase gen types` after migrations are applied
- [ ] Compare generated types against hand-written interfaces and resolve any discrepancies
- [ ] Run `npx tsc --noEmit` after switching to generated types and fix any resulting errors

---

## 🗂️ 5. Storage

- [ ] Confirm `portfolio-images` bucket exists and is **Public**
- [ ] Confirm `avatars` bucket exists and is **Public**
- [ ] Confirm RLS on `storage.objects` allows `SELECT` for anon, `INSERT/UPDATE/DELETE` only for file path owner
- [ ] Test a real upload: authenticated user uploads to `portfolio-images/{their-user-id}/test.jpg` — confirm success
- [ ] Test unauthorized upload: authenticated user uploads to `portfolio-images/{other-user-id}/test.jpg` — confirm 403
- [ ] **Image Transform Tier Check:** Confirm the Supabase plan supports the `/storage/v1/render/` endpoint
  - If on Free tier: remove transform URL patterns, use raw object URLs, or implement client-side resizing before upload (e.g. `browser-image-compression` npm package)

---

## 🔍 6. Query Layer — Smoke Tests

Run these against a seeded database with at least 2 users and 3 job listings:

- [ ] `getProfileBySlug()` returns correct profile for valid slug, `{ data: null, error }` for unknown slug
- [ ] `searchProfiles({ role: 'student' })` returns only students, paginated to 20 by default
- [ ] `getJobListings()` returns only `status = 'open'` listings by default
- [ ] `getJobListings({ type: 'internship' })` filters correctly
- [ ] `toggleBookmark(listingId)` — call twice, confirm first call returns `{ data: true }`, second returns `{ data: false }`
- [ ] `getBookmarkedListings()` returns the listings linked to current user's bookmarks

---

## 🌐 7. Vercel Deployment

- [ ] Add all `.env.local` variables as Vercel Environment Variables (do NOT use service role key in edge functions)
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set under Preview + Production
- [ ] Confirm middleware runs correctly on Vercel edge (session refresh works on deployed URL)
- [ ] Set Supabase Auth **Site URL** to the production Vercel URL
- [ ] Add production URL to Supabase Auth **Redirect URLs**

---

## 🚨 8. Remove Dev Auth Bypass

The following files were added as temporary scaffolding to allow local preview
without live Supabase keys. **Remove or disable all of them once real auth is
verified working end-to-end:**

- [x] Delete `lib/supabase/mock-auth.ts` (mock data + `isBypassActive()` guard)
- [x] Delete `app/api/dev-login/route.ts` (mock cookie endpoint)
- [x] Delete `app/components/DevBanner.tsx` (yellow warning banner)
- [x] Remove `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` from `.env.local`
- [x] Remove bypass branches from `lib/supabase/middleware.ts` (lines using `isBypassActive`)
- [ ] Remove bypass branches from `lib/queries/profiles.ts`, `jobs.ts`, `portfolio.ts`
- [x] Remove `DevBanner` import and `isDevBypass` padding from `app/layout.tsx`
- [ ] Remove `"use client"`, `handleDevLogin`, and the skip button block from `app/(auth)/login/page.tsx`
- [ ] Run `npm run build` and confirm zero errors after removal
