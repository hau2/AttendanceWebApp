---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Division, Acknowledgment & Remote Work
status: roadmap_ready
last_updated: "2026-03-03T14:04:00Z"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 6
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Employees check in/out quickly with photo evidence — managers and admins have real-time, accurate attendance data — any company deployed in minutes with no IT support
**Current focus:** Phase 8 - Remote Work + Acknowledgment (next)

## Current Position

Phase: Phase 7 - Employee Lifecycle + Per-User Timezone (COMPLETE)
Plan: 07-04 (employee lifecycle frontend — complete)
Status: 07-04 complete — Delete with confirm, EditUserModal (fullName+division+timezone), Manager column via division join, manager-scoped CreateUserModal, Manager role page access. TypeScript clean. EMPL-01 through EMPL-04 frontend delivered.
Last activity: 2026-03-03 — 07-04 executed and committed

Progress: [█████████░░░░░░░░░░░] 20% (1/5 v2.0 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 20 (v1.0 milestone)
- Average duration: ~5 min
- Total execution time: ~53 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | ~6 min |
| 02-workforce-configuration | 4 | ~23 min | ~6 min |
| 03-attendance-core | 6 | ~23 min | ~4 min |
| 04-admin-adjustments | 2/2 | ~14 min | ~7 min |
| 05-monitoring-reporting | 5/5 | ~25 min | ~5 min |

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
- listRecords() managerId param: when role=manager, controller passes userId as managerId; scopes records via sub-query on users table where manager_id=managerId (05-01)
- Empty employee list returns [] immediately in listRecords/getTeamSummary — avoids .in('user_id', []) Supabase behavior (05-01)
- GET /attendance/reports/team-summary placed before :id param routes — prevents NestJS treating 'team-summary' as a record ID (05-01)
- punctualityRate = 100 when total = 0 — sensible default for managers with no attendance data in selected month (05-01)
- import type { Response } from 'express' required when isolatedModules + emitDecoratorMetadata both enabled — avoids TS1272 decorator metadata error (05-02)
- exportCsv() delegates to getMonthlyReport() — single source of truth for manager-scope query logic (05-02)
- Attendance rate = distinct user IDs with records / total active users — reflects who showed up, not record count (05-02)
- CSV timestamps formatted with toLocaleString('en-US', { timeZone: 'UTC' }) — raw UTC acceptable for export (05-02)
- Manager employee dropdown filtered client-side (manager_id === currentUserId) — backend already scopes records; client-side filter gives consistent UX in dropdown without an extra API endpoint (05-03)
- Team summary fetch added inside year/month/role useEffect with userRole as dependency so fetch fires correctly after role is set on initial load (05-03)
- teamSummary null-guarded in JSX — card only renders when data available; silently suppresses on API error (05-03)
- blob/URL.createObjectURL() used for CSV download — preserves Authorization header without query-param token exposure (05-04)
- layout.tsx converted to 'use client' with useEffect for role detection — enables conditional nav link rendering (05-04)
- Executive dashboard enforces EXEC-05 read-only by absence of any edit controls — no special disabling logic needed (05-04)
- Phase 5 E2E human verification passed — all 9 test cases confirmed; no code changes required post-verification (05-05)
- divisions.manager_id is nullable (ON DELETE SET NULL) — a division can exist without an assigned manager (06-01)
- users.division_id is nullable (ON DELETE SET NULL) — deleting a division orphans employees to no division rather than cascading delete (06-01)
- UNIQUE(company_id, name) on divisions enforced at DB constraint level — prevents duplicate division names within a company without application-layer checks (06-01)
- RLS on divisions uses company_id = JWT app_metadata.company_id — consistent with all other tenant-isolated tables (06-01)
- DivisionsModule exports DivisionsService so Plan 03 can inject it into AttendanceService without reimporting (06-02)
- listDivisions uses Supabase FK join alias users!divisions_manager_id_fkey to fetch manager full_name in single query (06-02)
- deleteDivision counts employees first, throws ConflictException with count message if > 0 — clear UX error showing how many employees need reassignment (06-02)
- countError on pre-delete count query treated as NotFoundException — division not accessible in tenant scope (06-02)
- Two-step division-based manager scoping: Step 1 finds divisions WHERE manager_id = managerId; Step 2 finds users WHERE division_id IN divisionIds — replaces direct manager_id lookup on users in all three attendance methods (06-03)
- Early-return empty result at division step (before employee lookup) when manager has no divisions — avoids unnecessary second Supabase round-trip (06-03)
- Division ownership validated before assigning to user: BadRequestException if division.company_id != companyId — service-role bypasses RLS so explicit tenant check is required (06-03)
- divisionId clearing (null assignment) not supported in Phase 6 — DIVN-05 only requires assign/reassign; unassign deferred to later phase (06-03)
- DivisionsPage fetches divisions and users concurrently via Promise.all — single loading state; managers filtered client-side from full user list (06-04)
- Divisions nav link placed after Shifts and before Records in layout.tsx — logical admin workflow ordering (06-04)
- EditDivisionModal sends managerId: null on empty select to allow unsetting manager via PATCH (06-04)
- Delete error from backend ConflictException propagated directly to page error state — shows employee count message without frontend duplication (06-04)
- divisionId added to CreateUserDto and createUser service insert so new users can be assigned a division at creation time — avoids two-step create-then-assign UX (06-05)
- Division dropdown always visible in Actions column (not role-gated) — any user may be assigned to any division by Admin (06-05)
- Divisions fetched in parallel with users via Promise.all in refreshUsers — single function handles both refresh scenarios (06-05)
- users.timezone is nullable TEXT — NULL = use company timezone (zero regression); non-null = IANA string for per-employee late/early classification override (07-01)
- Soft-delete pattern: Auth.admin.deleteUser() removes login capability, then is_active=false set on public.users row — row is never deleted so attendance records retain employee full_name (07-02)
- Owner role blocked from deletion at service layer before any Auth call — BadRequestException prevents accidental loss of company access (07-02)
- Manager role permitted on POST /users only for employee role creation; must supply a divisionId from their own managed divisions — ForbiddenException if division not managed by caller (07-02)
- listUsers() uses nested Supabase FK join users!divisions_manager_id_fkey to return division manager name in single query without additional round-trip (07-02)
- validateManagerDivisionOwnership() lives in UsersService (not controller) — controller delegates, service validates — consistent thin-controller pattern (07-02)
- timezone field in UpdateUserDto accepts string | null — null explicitly clears per-user timezone override so user falls back to company timezone (07-02)
- effectiveTimezone = user.timezone ?? company.timezone applied inline in checkIn() and checkOut() after getCompanySettings(); only these two classification-path methods are updated — history/report methods unchanged (07-03)
- userRecord?.timezone cast as string | null before nullish coalescing to satisfy TypeScript strict mode with Supabase unknown return type (07-03)
- Manager column in UserTable resolves from user.divisions?.users?.full_name (nested FK join from backend, no extra API round-trip) (07-04)
- Delete button hidden for owner-role users at UI level, matching backend BadRequestException guard — dual guard at service + UI layers (07-04)
- window.confirm used for delete confirmation — consistent with plain Tailwind modal pattern; Shadcn Dialog not added (07-04)
- Manager role in UserTable sees static role span instead of role select — manager cannot change roles, only create employees (07-04)
- availableDivisions computed in CreateUserModal: divisions.filter(d => d.manager_id === currentUserId) when currentUserRole === 'manager' (07-04)

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
- Run 007_divisions.sql migration in Supabase SQL editor before testing Division endpoints (Phase 6)
- Run 004_divisions_rls.sql RLS policy in Supabase SQL editor AFTER running 007_divisions.sql (Phase 6)
- Run 008_employee_lifecycle.sql migration in Supabase SQL editor before testing Phase 7 endpoints (adds users.timezone column)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 07-04-PLAN.md — employee lifecycle frontend (Delete, EditUserModal, Manager column, manager-scoped Create)
Resume file: None
Next: Phase 8 — Remote work flag + acknowledgment workflow
Next: 07-04-PLAN.md — Frontend: EditUserModal (name/division/timezone), Delete button + confirmation, Manager-scoped Create, Manager column in UserTable
