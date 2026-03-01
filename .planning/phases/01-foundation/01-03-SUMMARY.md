---
phase: 01-foundation
plan: 03
subsystem: onboarding
tags: [nestjs, nextjs, typescript, supabase, company-settings, onboarding-wizard, logout, jwt, class-validator]

# Dependency graph
requires:
  - phase: 01-01
    provides: Supabase service-role client (SupabaseService), companies and users tables
  - phase: 01-02
    provides: JwtAuthGuard, JWT payload (userId, email, companyId, role), clearSession() + getStoredToken() helpers

provides:
  - PATCH /company/settings endpoint — updates timezone and ip_mode for authenticated company
  - GET /company/settings endpoint — returns company settings for authenticated user
  - POST /onboarding/complete endpoint — creates first shift + first employee user + sets onboarding_complete=true
  - 3-step onboarding wizard UI at /onboarding (timezone/ip_mode -> shift -> first user)
  - LogoutButton component clearing session and redirecting to /login
  - (app) route group layout with header containing LogoutButton
  - Placeholder /dashboard page for post-onboarding redirect
  - SQL migration 002 — shifts table with RLS tenant isolation
affects:
  - all subsequent phases (attendance tracking, admin panel, reporting)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Company settings pattern: PATCH /company/settings accepts partial updates via optional DTO fields — only defined fields are applied to updateData"
    - "Onboarding completion pattern: atomic multi-step operation (create shift -> create Supabase auth user -> create public.users record -> mark onboarding_complete)"
    - "Frontend step wizard pattern: single page component with step state, each step submits independently, back/next navigation"
    - "LogoutButton pattern: client component calling clearSession() + router.push('/login') on click"

key-files:
  created:
    - backend/src/company/company.module.ts
    - backend/src/company/company.controller.ts
    - backend/src/company/company.service.ts
    - backend/src/company/dto/update-company-settings.dto.ts
    - backend/src/onboarding/onboarding.module.ts
    - backend/src/onboarding/onboarding.controller.ts
    - backend/src/onboarding/onboarding.service.ts
    - backend/src/onboarding/dto/complete-onboarding.dto.ts
    - backend/src/database/migrations/002_shifts_table.sql
    - frontend/src/app/(app)/layout.tsx
    - frontend/src/app/(app)/onboarding/page.tsx
    - frontend/src/app/(app)/dashboard/page.tsx
    - frontend/src/components/LogoutButton.tsx
    - frontend/src/lib/api/company.ts
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "Timezone saved via PATCH /company/settings in wizard step 1 — separate from POST /onboarding/complete which handles shift + user creation and marks onboarding_complete"
  - "OnboardingService uses manual rollback on user creation failure — if public.users insert fails, auth user is deleted to prevent orphaned auth records"
  - "Shifts table created in plan 01-03 migration with minimal v1 schema — Phase 2 may expand with additional columns"
  - "catch (err: unknown) used instead of (err: any) for TypeScript strict mode compliance"

patterns-established:
  - "Route group pattern: (app) and (auth) Next.js route groups provide shared layouts without affecting URL paths"
  - "RLS on shifts: same company_id tenant isolation pattern as companies/users tables"

requirements-completed: [ONBD-02, ONBD-03, ONBD-04, AUTH-03]

# Metrics
duration: 7min
completed: 2026-03-01
---

# Phase 1 Plan 03: Onboarding Wizard and Company Settings Summary

**NestJS company settings API (PATCH/GET /company/settings) and onboarding completion endpoint (POST /onboarding/complete) with a 3-step Next.js wizard (timezone/ip_mode -> shift -> first employee) and LogoutButton component**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-01T15:54:29Z
- **Completed:** 2026-03-01T16:01:00Z
- **Tasks:** 2 auto + 1 checkpoint (human-verify — pending)
- **Files modified:** 15

## Accomplishments
- Created NestJS CompanyModule with GET /company/settings and PATCH /company/settings endpoints, protected by JwtAuthGuard, updating timezone/ip_mode/ipAllowlist fields on the companies table
- Created NestJS OnboardingModule with POST /onboarding/complete that atomically creates a shift, creates first employee in Supabase Auth + public.users, and sets onboarding_complete=true
- Created SQL migration 002_shifts_table.sql with minimal v1 schema and RLS tenant isolation policy
- Built 3-step onboarding wizard React component with progress bar, validation, and step-by-step data collection
- Added LogoutButton component and (app) route group layout with header so logout is available on every app page
- Added placeholder /dashboard page as redirect destination after onboarding completion

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend company settings API and onboarding completion endpoint** - `2637fd6` (feat)
2. **Task 2: Frontend onboarding wizard, logout button, and app shell layout** - `d99ae6f` (feat)

## Files Created/Modified
- `backend/src/company/company.module.ts` - NestJS module exporting CompanyService
- `backend/src/company/company.controller.ts` - GET /company/settings and PATCH /company/settings, JwtAuthGuard protected
- `backend/src/company/company.service.ts` - getSettings() and updateSettings() using SupabaseService
- `backend/src/company/dto/update-company-settings.dto.ts` - Optional timezone, ipMode, ipAllowlist fields with class-validator
- `backend/src/onboarding/onboarding.module.ts` - NestJS module
- `backend/src/onboarding/onboarding.controller.ts` - POST /onboarding/complete, JwtAuthGuard protected
- `backend/src/onboarding/onboarding.service.ts` - completeOnboarding() with shift creation, user creation, and onboarding_complete flag
- `backend/src/onboarding/dto/complete-onboarding.dto.ts` - shift fields + firstUser fields with class-validator
- `backend/src/database/migrations/002_shifts_table.sql` - shifts table DDL with uuid PK, company_id FK, time fields, RLS policy
- `backend/src/app.module.ts` - Updated to import CompanyModule and OnboardingModule
- `frontend/src/app/(app)/layout.tsx` - App shell with header + LogoutButton, wraps all authenticated pages
- `frontend/src/app/(app)/onboarding/page.tsx` - 3-step wizard (timezone/ip_mode -> shift -> first employee)
- `frontend/src/app/(app)/dashboard/page.tsx` - Placeholder page, redirect destination after onboarding
- `frontend/src/components/LogoutButton.tsx` - Client component calling clearSession() + router.push('/login')
- `frontend/src/lib/api/company.ts` - updateCompanySettings() and completeOnboarding() fetch helpers with auth headers

## Decisions Made
- Timezone is saved in step 1 via PATCH /company/settings (separate API call) while POST /onboarding/complete handles step 2+3 data. This lets users save timezone independently without requiring all 3 steps to be complete in a single request.
- OnboardingService performs manual rollback: if public.users insert fails after Supabase Auth user is created, the auth user is deleted to prevent orphaned records. This mirrors the registration pattern from plan 01-02.
- Shifts table migration (002) is created as part of this plan since Phase 2 needs the table to already exist but doesn't define it yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed catch clause types from 'any' to 'unknown'**
- **Found during:** Task 2 (onboarding wizard page)
- **Issue:** Plan used `catch (err: any)` in the wizard handlers. TypeScript strict mode and ESLint `@typescript-eslint/no-explicit-any` flag this as an error, as seen in plan 01-02.
- **Fix:** Changed to `catch (err: unknown)` with `err instanceof Error ? err.message : 'fallback'` pattern throughout onboarding/page.tsx
- **Files modified:** frontend/src/app/(app)/onboarding/page.tsx, frontend/src/lib/api/company.ts
- **Verification:** Frontend TypeScript build passes cleanly
- **Committed in:** d99ae6f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (TypeScript strict mode catch clause type)
**Impact on plan:** Required for correct TypeScript compilation. No scope creep.

## Issues Encountered
- None significant — build passed on first attempt for both backend and frontend.

## User Setup Required

**Run SQL migration 002 in Supabase before testing onboarding wizard:**

1. Open your Supabase project SQL editor
2. Run `backend/src/database/migrations/002_shifts_table.sql` — creates shifts table with RLS policy

(Other environment setup already documented in 01-01-SUMMARY.md and 01-02-SUMMARY.md)

## Next Phase Readiness
- All Phase 1 requirements satisfied: ONBD-01 through ONBD-04, AUTH-01 through AUTH-03, SECU-01, SECU-02
- Shifts table created and ready for Phase 2 to expand with additional columns
- Company timezone saved before any attendance tracking begins
- Logout available on every authenticated page via LogoutButton in app shell layout
- Pending: Human verification of full end-to-end flow (registration -> onboarding -> dashboard -> logout)

## Self-Check: PASSED

Files verified on disk:
- backend/src/company/company.module.ts: EXISTS
- backend/src/company/company.controller.ts: EXISTS
- backend/src/company/company.service.ts: EXISTS
- backend/src/company/dto/update-company-settings.dto.ts: EXISTS
- backend/src/onboarding/onboarding.module.ts: EXISTS
- backend/src/onboarding/onboarding.controller.ts: EXISTS
- backend/src/onboarding/onboarding.service.ts: EXISTS
- backend/src/onboarding/dto/complete-onboarding.dto.ts: EXISTS
- backend/src/database/migrations/002_shifts_table.sql: EXISTS
- frontend/src/app/(app)/layout.tsx: EXISTS
- frontend/src/app/(app)/onboarding/page.tsx: EXISTS
- frontend/src/app/(app)/dashboard/page.tsx: EXISTS
- frontend/src/components/LogoutButton.tsx: EXISTS
- frontend/src/lib/api/company.ts: EXISTS

Commits verified: 2637fd6 (Task 1), d99ae6f (Task 2) - both in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
