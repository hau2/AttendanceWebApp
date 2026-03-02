---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-02T16:04:08.098Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 15
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Employees check in/out quickly with photo evidence — managers and admins have real-time, accurate attendance data — any company deployed in minutes with no IT support
**Current focus:** Phase 4 - Admin Adjustments

## Current Position

Phase: 4 of 5 (Admin Adjustments) — COMPLETE
Plan: 2 of 2 complete — Plan 04-02 complete (2026-03-02)
Status: Phase 4 complete — all ADJT requirements delivered and E2E verified; Phase 5 Monitoring & Reporting is next
Last activity: 2026-03-02 — Plan 04-02 (Admin Adjustments Frontend) complete; AdjustAttendanceModal + in-place record refresh + human verification approved

Progress: [████████████████████] 88%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: ~5 min
- Total execution time: ~53 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | ~6 min |
| 02-workforce-configuration | 4 | ~23 min | ~6 min |
| 03-attendance-core | 6 | ~23 min | ~4 min |
| 04-admin-adjustments | 2/2 | ~14 min | ~7 min |

**Recent Trend:**
- Last 5 plans: 8 min, 2 min, 5 min, 8 min, 8 min
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- One active shift per employee (not schedule-based) — keeps v1 simple
- Manager is also an attendance participant — any user with an assigned shift (incl. Managers) can check-in/out; Manager is a permission role layered on top of attendance capability (Phase 3 must allow check-in for all roles with a shift, not just 'employee')
- No in-system correction request flow — Admin adjusts directly with audit trail
- No notifications in v1 — manual dashboard monitoring sufficient
- IP mode configurable per company (log-only vs enforce-block)
- Photos visible to Admin and Manager only; employees see their own only
- No face recognition in v1 — photo-as-evidence without AI
- Service-role key on backend bypasses RLS — never exposed to frontend (01-01)
- Anon key on frontend is subject to RLS — enforces tenant isolation at DB layer (01-01)
- JWT app_metadata.company_id used as RLS claim — populated in auth.admin.createUser() during registration (01-02)
- SupabaseModule is @Global() — injectable anywhere in NestJS without re-import (01-01)
- Non-httpOnly cookie for access_token — Next.js Edge middleware cannot read httpOnly cookies (01-02)
- Atomic registration uses sequential operations with manual rollback — Supabase Auth Admin API and DB are independent systems (01-02)
- tsconfig @/* alias points to ./src/* — app/ is at root but source utilities live under src/ (01-02)
- Timezone saved via PATCH /company/settings in step 1, POST /onboarding/complete handles shift + user + onboarding_complete flag (01-03)
- OnboardingService manual rollback: if public.users insert fails, auth user is deleted to prevent orphaned records (01-03)
- catch (err: unknown) pattern used throughout — TypeScript strict mode compliance (01-03)
- ban_duration='876000h' used to ban disabled users in Supabase Auth — prevents new token issuance; existing tokens expire naturally via JWT TTL (02-01)
- app_metadata updated on role change via auth.admin.updateUserById — ensures future login tokens carry the new role claim (02-01)
- Modal overlay implemented with plain Tailwind (fixed inset-0 + centered card) — avoids Shadcn Dialog import complexity (02-02)
- CSV import sends sequential POST /users calls (not Promise.all) — prevents rate limit issues on large imports (02-02)
- CSV parsing uses FileReader + split on newline/comma — no library needed for v1 (02-02)
- Owner role excluded from role selector dropdown — prevents accidental demotion of company owner (02-02)
- ShiftsModule exports ShiftsService so plan 04 can inject it via DI without re-querying (02-03)
- PATCH uses sparse update (only defined fields) — consistent with UsersModule pattern (02-03)
- Frontend time inputs use type=time (browser-native HH:MM) — no custom picker needed (02-03)
- Active shift = latest employee_shifts row with effective_date <= today (ORDER BY DESC LIMIT 1) — null returned when no assignment exists, not an error (02-04)
- ShiftAssignmentsService exported from ShiftsModule; Phase 3 injects it directly for on-time/late classification at check-in (02-04)
- Dual tenant guard before assignment insert: both shift and user verified to belong to companyId — prevents cross-tenant assignment (02-04)
- ConflictException (409) on UNIQUE(user_id, effective_date) violation with message directing admin to choose a different date (02-04)
- listAssignments returns full history descending — modal surfaces it as an audit trail; old assignments never deleted (02-04)
- Storage path format {companyId}/{userId}/{timestamp}.jpg enforces tenant isolation at storage layer even without bucket RLS (03-02)
- Private bucket (not public) — all access via signed URLs; service-role bypasses RLS for URL generation (03-02)
- EVID-03 (90-180 day) photo retention deferred to v2 — v1 retains photos indefinitely (within spec) (03-02)
- attendance.module.ts created as stub by Plan 03-02; Plan 03-01 extends it with AttendanceController/Service (03-02)
- Empty IP allowlist treated as no restriction (withinAllowlist=true, blocked=false) — companies without IP policy must not block employees (03-01)
- getWorkDate uses toLocaleDateString('en-CA', { timeZone }) — produces YYYY-MM-DD natively without date libraries (03-01)
- Minute-based shift classification using toLocaleTimeString for timezone conversion — avoids manual UTC offset math (03-01)
- Date range filter uses gte startDate + lt nextMonthStart — avoids date_trunc, Supabase/PostgREST compatible (03-01)
- listRecords joins users table for full_name — admin view shows employee names without second query (03-01)
- @Cron('5 0 * * *') at 00:05 UTC with eq(missing_checkout,false) idempotency guard; source='system' distinguishes auto-marks from admin adjustments (03-03)
- Per-company timezone loop in cron: fetch all companies, compute todayInCompanyTz via toLocaleDateString('en-CA'), batch update per company — never a single global date (03-03)
- Backend-driven late reason / early note: frontend attempts submission first; shows field only on 400 "requires a reason/note" — avoids duplicating classification logic in frontend (03-04)
- facingMode: environment with fallback to { video: true } — supports mobile rear camera with desktop fallback (03-04)
- getTodayRecord on mount restores button state so page refresh shows correct action (CHECK-IN vs CHECK-OUT vs done) (03-04)
- Employee history uses expandable table rows (chevron) for photo/reason detail — keeps table compact without modal overhead (03-05)
- Admin attendance page has breadcrumb nav (Users / Shifts / Attendance Records) — consistent with Phase 2 admin area style (03-05)
- AttendanceRecordDetail uses plain Tailwind modal (fixed inset-0 + centered card) — consistent with Phase 2 modal pattern (03-05)
- Phase 3 E2E human verification passed — all 22 verification steps confirmed; no code changes required post-verification (03-06)
- Per-field audit rows in attendance_adjustments — one row per changed field preserves old/new values; attendance_records holds only current values (04-01)
- datetime-local input sliced to YYYY-MM-DDTHH:MM for display; :00.000Z appendage replaced with proper local-to-UTC conversion — satisfies backend IsISO8601 and handles non-UTC admin timezones (04-02)
- Save button requires non-empty reason AND at least one changed time — prevents accidental no-op adjustments (04-02)
- AdjustAttendanceModal uses z-[60] to layer correctly over z-50 AttendanceRecordDetail parent modal (04-02)
- onSaved merges { ...record, ...updated } to preserve users join data not returned by PATCH endpoint (04-02)
- Phase 4 E2E human verification passed — all 10 test cases confirmed; timezone bug found and fixed during verification (04-02)
- old_value nullable in audit table — supports setting check_out_at on missing_checkout records where previous value was NULL (04-01)
- missing_checkout flag auto-cleared by service when check_out_at is adjusted by admin — prevents cron double-marking (04-01)
- PATCH /attendance/records/:id restricted to admin and owner only (not manager) — managers can view but not correct records in v1 (04-01)
- source field set to 'admin' on adjustment — distinguishes manual corrections from employee actions and system cron (04-01)

### Pending Todos

- Apply SQL migrations to Supabase before running backend (manual step — see 01-01-SUMMARY.md)
- Run 002_shifts_table.sql migration in Supabase SQL editor before testing onboarding wizard
- Run 003_workforce_config.sql migration in Supabase SQL editor before using Users endpoints
- Run 002_workforce_rls.sql RLS policy in Supabase SQL editor before using Users endpoints
- Copy backend/.env.example to backend/.env with Supabase credentials, JWT_SECRET, FRONTEND_URL
- Copy frontend/.env.example to frontend/.env.local with Supabase credentials and NEXT_PUBLIC_API_URL
- Create Supabase Storage bucket 'attendance-photos' (private, 5MB limit) — see 005_photo_storage.sql
- Run 004_attendance_records.sql migration in Supabase SQL editor before testing check-in/out endpoints
- Run 003_attendance_rls.sql RLS policy in Supabase SQL editor before using attendance endpoints from frontend
- Run 006_attendance_adjustments.sql migration in Supabase SQL editor before testing PATCH /attendance/records/:id endpoint

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-02
Stopped at: Phase 4 complete — Plan 04-02 (Admin Adjustments Frontend) complete and E2E verified; ready for Phase 5 (Monitoring & Reporting)
Resume file: None
