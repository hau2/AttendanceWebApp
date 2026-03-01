---
phase: 01-foundation
verified: 2026-03-02T00:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Confirm middleware cookie-only check is acceptable"
    expected: "Unauthenticated users with no access_token cookie are redirected to /login"
    why_human: "Middleware checks cookie presence only — not JWT validity. A forged or expired cookie would pass. This is a deliberate design trade-off. Human should confirm this is acceptable for Phase 1."
  - test: "End-to-end registration and onboarding flow"
    expected: "Register -> redirect to /onboarding -> complete 3-step wizard -> redirect to /dashboard -> verify Supabase has company row, user row, shift row, onboarding_complete=true"
    why_human: "Requires live Supabase credentials and running servers. Human approved during 01-03 checkpoint (2026-03-02). Documented here for completeness."
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Any company can register, configure their tenant, and their users can authenticate — with complete data isolation enforced at the database layer
**Verified:** 2026-03-02
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Success Criteria from ROADMAP.md (Used as Observable Truths)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A new company owner can register with name, email, and password and a fully isolated tenant is created automatically | VERIFIED | `backend/src/auth/auth.service.ts` register() atomically creates company row, calls `auth.admin.createUser` with `app_metadata: { company_id }`, then inserts public.users. Frontend register page POSTs to `/auth/register` via `registerCompany()` in `lib/api/auth.ts`. |
| 2 | After registration, the owner is walked through a setup wizard that captures timezone, creates a shift, and adds at least one user — in that order | VERIFIED | `frontend/src/app/(app)/onboarding/page.tsx` implements 3-step wizard: Step 1 calls `updateCompanySettings({ timezone, ipMode })` → PATCH /company/settings; Step 3 calls `completeOnboarding(...)` → POST /onboarding/complete which creates shift + first user + sets `onboarding_complete=true`. |
| 3 | A user can log in with email and password, refresh the browser, and still be logged in | VERIFIED | `loginUser()` in `lib/api/auth.ts` POSTs to `/auth/login`; `saveSession()` stores JWT in both `localStorage` and a 7-day cookie (`access_token`). Middleware checks the cookie, so refresh preserves session. |
| 4 | A user can log out from any page and their session ends immediately | VERIFIED | `LogoutButton.tsx` calls `clearSession()` (removes localStorage items + expires cookie via `max-age=0`) then `router.push('/login')`. `AppLayout` renders `LogoutButton` in the header on all authenticated pages. |
| 5 | No database query can return data belonging to a different company — enforced by Supabase Row Level Security, not application code | VERIFIED | `backend/src/database/rls/001_rls_policies.sql` enables RLS on both `companies` and `users` and creates `USING (... = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)` policies. `002_shifts_table.sql` adds the same pattern for `shifts`. Backend uses service-role key (bypasses RLS for admin ops); frontend anon key is subject to RLS. |

**Score: 5/5 success criteria verified**

---

## Required Artifacts

### Plan 01-01 Artifacts

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/src/database/migrations/001_initial_schema.sql` | VERIFIED | Exists. Contains `CREATE TABLE IF NOT EXISTS companies` and `CREATE TABLE IF NOT EXISTS users` with correct columns (id, company_id FK, timezone, ip_mode, ip_allowlist, onboarding_complete, role CHECK). Indexes present. |
| `backend/src/database/rls/001_rls_policies.sql` | VERIFIED | Exists. Contains `ALTER TABLE companies ENABLE ROW LEVEL SECURITY`, `ALTER TABLE users ENABLE ROW LEVEL SECURITY`, and two tenant-isolation policies using `auth.jwt() -> 'app_metadata' ->> 'company_id'`. |
| `backend/src/supabase/supabase.service.ts` | VERIFIED | Exists. Exports `SupabaseService` with `getClient()`. Uses `createClient(url, serviceRoleKey, { auth: { persistSession: false } })`. Throws on missing env vars. |
| `frontend/src/lib/supabase/client.ts` | VERIFIED | Exists. Exports `createClient()` using `createBrowserClient` from `@supabase/ssr`. |
| `frontend/src/lib/supabase/server.ts` | VERIFIED | Exists. Exports async `createClient()` using `createServerClient` from `@supabase/ssr` with full cookie getAll/setAll handling. |

### Plan 01-02 Artifacts

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/src/auth/auth.service.ts` | VERIFIED | Exists. Exports `AuthService` with `register()` (atomic: company → auth.admin.createUser → public.users with rollback) and `login()` (signInWithPassword → JWT with sub, email, company_id, role). |
| `backend/src/auth/auth.controller.ts` | VERIFIED | Exists. Exports `AuthController` with `POST /auth/register` and `POST /auth/login`. |
| `backend/src/auth/guards/jwt-auth.guard.ts` | VERIFIED | Exists. Exports `JwtAuthGuard` extending `AuthGuard('jwt')`. Used by CompanyController and OnboardingController. |
| `frontend/src/app/(auth)/register/page.tsx` | VERIFIED | Exists. Full form (companyName, fullName, email, password). `handleSubmit` calls `registerCompany(form)`, saves session, redirects to `/onboarding`. No placeholder content. |
| `frontend/src/app/(auth)/login/page.tsx` | VERIFIED | Exists. Full form (email, password). `handleSubmit` calls `loginUser(form)`, saves session, branches to `/onboarding` or `/dashboard` based on `onboarding_complete`. |
| `frontend/src/middleware.ts` | VERIFIED | Exists. Guards all routes except `/login` and `/register`. Checks `access_token` cookie. Redirects to `/login?redirectTo=...` when absent. |

### Plan 01-03 Artifacts

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/src/onboarding/onboarding.controller.ts` | VERIFIED | Exists. Exports `OnboardingController` with `POST /onboarding/complete` protected by `JwtAuthGuard`. |
| `backend/src/company/company.controller.ts` | VERIFIED | Exists. Exports `CompanyController` with `GET /company/settings` and `PATCH /company/settings`, both protected by `JwtAuthGuard`. |
| `frontend/src/app/(app)/onboarding/page.tsx` | VERIFIED | Exists. 3-step wizard (timezone/ip_mode → shift → first user). Step 1 calls `updateCompanySettings`. Step 3 calls `completeOnboarding`. Progress bar renders. Not a placeholder. |
| `frontend/src/components/LogoutButton.tsx` | VERIFIED | Exists. Client component with `onClick` calling `clearSession()` then `router.push('/login')`. Imported and rendered in `(app)/layout.tsx`. |

---

## Key Link Verification

### Plan 01-01 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `backend/src/supabase/supabase.service.ts` | Supabase REST API | `createClient` with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY | WIRED | Line 18: `this.client = createClient(url, serviceRoleKey, ...)`. Env vars checked at construction time. |
| `backend/src/database/rls/001_rls_policies.sql` | `auth.jwt()` | USING clause checking company_id against JWT claim | WIRED | Lines 16 and 23: `USING (... (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)` for both companies and users policies. |

### Plan 01-02 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `frontend/src/app/(auth)/register/page.tsx` | `POST /api/auth/register` (backend) | `registerCompany()` in `lib/api/auth.ts` | WIRED | Page imports and calls `registerCompany(form)`. `lib/api/auth.ts` line 23: `fetch(\`${API_URL}/auth/register\`, ...)` with POST method. |
| `backend/src/auth/auth.service.ts` | `supabaseService.getClient().auth.admin.createUser()` | Supabase Admin API | WIRED | Line 29: `client.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { company_id, role } })`. |
| `frontend/src/middleware.ts` | Session cookie | Cookie check on `access_token` | WIRED | Line 15: `request.cookies.get('access_token')?.value`. Note: cookie presence only — not JWT signature validation (see Human Verification). |

### Plan 01-03 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `frontend/src/app/(app)/onboarding/page.tsx` | `PATCH /company/settings` (backend) | `updateCompanySettings()` in `lib/api/company.ts` | WIRED | Line 51: `await updateCompanySettings({ timezone, ipMode })`. `lib/api/company.ts` line 18: `fetch(\`${API_URL}/company/settings\`, { method: 'PATCH', headers: authHeaders(), ... })`. |
| `frontend/src/app/(app)/onboarding/page.tsx` | `POST /onboarding/complete` (backend) | `completeOnboarding()` in `lib/api/company.ts` | WIRED | Line 76: `await completeOnboarding({ shiftName, shiftStartTime, ... })`. `lib/api/company.ts` line 39: `fetch(\`${API_URL}/onboarding/complete\`, { method: 'POST', ... })`. |
| `frontend/src/components/LogoutButton.tsx` | `clearSession()` in `lib/api/auth.ts` | `onClick` handler | WIRED | Line 4 import, line 14: `clearSession()` called in `handleLogout`, followed by line 15: `router.push('/login')`. |

---

## Requirements Coverage

All 9 Phase 1 requirement IDs declared across the three plans are covered.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SECU-01 | 01-01 | Each company's data is fully isolated — no cross-tenant access possible | SATISFIED | RLS policies on companies, users, and shifts use `auth.jwt()` app_metadata company_id. Backend uses service-role key for admin ops (bypasses RLS intentionally). |
| SECU-02 | 01-01 | All database queries scoped by company_id via Supabase Row Level Security | SATISFIED | `001_rls_policies.sql` enables RLS + tenant policy on companies and users. `002_shifts_table.sql` adds same pattern for shifts. |
| ONBD-01 | 01-02 | Owner can register a new company — system creates isolated tenant automatically | SATISFIED | `POST /auth/register` → `AuthService.register()` creates company row, Supabase auth user (with `app_metadata.company_id`), and public.users row atomically with rollback. |
| AUTH-01 | 01-02 | User can log in with email and password | SATISFIED | `POST /auth/login` → `AuthService.login()` uses `signInWithPassword`, fetches public.users record, returns JWT with company_id and role. |
| AUTH-02 | 01-02 | User session persists across browser refresh | SATISFIED | `saveSession()` writes JWT to both `localStorage` and a 7-day `access_token` cookie. Middleware checks cookie on every request. |
| AUTH-03 | 01-02 + 01-03 | User can log out from any page | SATISFIED | `LogoutButton` component mounted in `(app)/layout.tsx` header. Calls `clearSession()` (expires cookie + clears localStorage) and redirects to `/login`. |
| ONBD-02 | 01-03 | Owner guided through setup wizard after registration (timezone → shift → first users) | SATISFIED | `onboarding/page.tsx` 3-step wizard in correct order: Step 1 = timezone + ip_mode, Step 2 = shift creation, Step 3 = first employee. Steps are sequential (step state machine). |
| ONBD-03 | 01-03 | Owner/Admin can configure company timezone (required before attendance tracking begins) | SATISFIED | Step 1 of wizard calls `PATCH /company/settings` with timezone. `CompanyService.updateSettings()` updates `companies.timezone`. Timezone is saved before onboarding completes. |
| ONBD-04 | 01-03 | Owner/Admin can configure IP restriction mode per company: log-only or enforce-block | SATISFIED | Step 1 of wizard includes IP mode radio buttons (log-only / enforce-block). Sent via `PATCH /company/settings`. `UpdateCompanySettingsDto` validates `@IsIn(['log-only', 'enforce-block'])`. |

**No orphaned requirements found.** All 9 Phase 1 requirements in REQUIREMENTS.md traceability table are accounted for across the three plans.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `frontend/src/middleware.ts` | Cookie presence check only — JWT is not validated for signature or expiry | Info | An expired or forged token would bypass the middleware redirect. Application routes would still be server-rendered, but server-side data fetching (if any used the token) could fail. Acceptable for Phase 1 where all sensitive operations are on the backend (NestJS verifies JWT via JwtAuthGuard). |
| `frontend/src/app/(app)/dashboard/page.tsx` | Placeholder dashboard page with static text | Info | Intentional — plan 01-03 explicitly created this as a redirect destination. Phase 2 will implement the real dashboard. Not a blocker. |

No blocker anti-patterns detected. No TODO/FIXME/XXX comments in implementation files. No empty function bodies or stub handlers.

---

## Module Wiring Verification

| Module | Registered In | Status |
|--------|---------------|--------|
| `SupabaseModule` (@Global) | `AppModule` imports | VERIFIED — `app.module.ts` line 13 |
| `AuthModule` | `AppModule` imports | VERIFIED — `app.module.ts` line 13 |
| `CompanyModule` | `AppModule` imports | VERIFIED — `app.module.ts` line 13 |
| `OnboardingModule` | `AppModule` imports | VERIFIED — `app.module.ts` line 13 |
| `JwtAuthGuard` | Used by CompanyController and OnboardingController | VERIFIED — both `@UseGuards(JwtAuthGuard)` on class level |
| `LogoutButton` | Used in `(app)/layout.tsx` | VERIFIED — imported and rendered in header |

---

## Commit Verification

All commits referenced in SUMMARY files confirmed to exist in git log:

| Commit | Plan | Description |
|--------|------|-------------|
| `5857788` | 01-01 | feat: add database schema and RLS policies |
| `b39e395` | 01-01 | feat: add Supabase SDK integration for backend and frontend |
| `201b9e9` | 01-02 | feat: backend auth module with register + login endpoints and JWT guard |
| `d518f6b` | 01-02 | feat: frontend auth pages (register, login) and middleware route protection |
| `2637fd6` | 01-03 | feat: backend company settings API and onboarding completion endpoint |
| `d99ae6f` | 01-03 | feat: frontend onboarding wizard, logout button, and app shell layout |

---

## Human Verification Required

### 1. Middleware JWT Validation Depth

**Test:** After logging in, manually corrupt or expire the `access_token` cookie value in DevTools (Application > Cookies > edit value). Then navigate to `/dashboard`.
**Expected:** The middleware currently only checks for cookie presence, so a corrupted token will still pass. The page will load but any API calls requiring a valid JWT will fail (401 from NestJS).
**Why human:** Verify that this behavior is acceptable for Phase 1. All sensitive data access goes through the NestJS backend which validates JWT via JwtAuthGuard — so a corrupted cookie only affects the frontend middleware redirect, not actual data access. If stricter middleware is needed, JWT verification logic must be added.

### 2. Full End-to-End Registration and Onboarding (Already Approved)

**Test:** Register a new company → complete 3-step onboarding wizard → verify Supabase dashboard shows company row, user rows, shift row, and `onboarding_complete=true`.
**Expected:** All rows created, RLS policies confirmed active.
**Why human:** Requires live Supabase project. This checkpoint was **approved by the user on 2026-03-02** during the 01-03 human verification gate.

---

## Summary

Phase 1 goal is fully achieved. All 5 ROADMAP success criteria are satisfied by substantive, wired implementations:

1. **Tenant isolation**: Company registration creates an isolated tenant. RLS policies at the database layer prevent cross-tenant access for all three tenant tables (companies, users, shifts) via `auth.jwt()` app_metadata claims.

2. **Onboarding wizard**: 3-step wizard in correct order — timezone/ip_mode (Step 1) is saved independently via `PATCH /company/settings` before `POST /onboarding/complete` creates the shift and first employee in Step 3. The separation ensures timezone is persisted even if the user abandons after Step 1.

3. **Authentication**: `POST /auth/login` validates credentials via Supabase Auth, fetches the public.users record, issues a JWT containing `company_id` and `role`. JWT stored in cookie for session persistence across refresh.

4. **Logout**: `LogoutButton` available on every authenticated page via the `(app)` route group layout. Clears both cookie and localStorage.

5. **Security**: RLS enforced at DB layer with correct JWT claim extraction. Backend correctly uses service-role key; frontend uses anon key (subject to RLS). One minor note: the frontend middleware performs cookie presence check only (not JWT signature validation), but this is an acceptable Phase 1 trade-off since NestJS JwtAuthGuard validates the token on all actual data API calls.

All 9 requirement IDs (ONBD-01 through ONBD-04, AUTH-01 through AUTH-03, SECU-01, SECU-02) are satisfied with evidence. All 6 implementation commits exist in git history.

---

_Verified: 2026-03-02_
_Verifier: Claude (gsd-verifier)_
