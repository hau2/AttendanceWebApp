---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-06T00:15:30.430Z"
progress:
  total_phases: 12
  completed_phases: 12
  total_plans: 50
  completed_plans: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Employees check in/out quickly with photo evidence — managers and admins have real-time, accurate attendance data — any company deployed in minutes with no IT support
**Current focus:** Phase 13 UI Redesign — matching Stitch HTML design

## Current Position

Phase: Phase 13 - UI Redesign
Plan: 13-05 (complete — Modals + Global Color Migration + Consistency)
Status: Phase 13 complete — all modals migrated to Shadcn Dialog, zero blue-600 refs, onboarding step indicator
Last activity: 2026-03-06 — 13-05 complete (9 modals migrated, global color to #4848e5, onboarding restyled)

Progress: [████████████████████] 100% (5/5 plans complete in Phase 13)

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
| Phase 08-remote-work-acknowledgment-flow P04 | 2 | 1 tasks | 0 files |
| Phase 12-ui-polish P01 | 4 | 2 tasks | 6 files |
| Phase 12-ui-polish P02 | 2 | 2 tasks | 4 files |
| Phase 13-ui-redesign P01 | 2 | 4 tasks | 4 files |

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
- is_remote BOOLEAN NOT NULL DEFAULT FALSE on attendance_records — no backfill required; existing rows default to in-person (false) (08-01)
- acknowledged_by/remote_acknowledged_by use ON DELETE SET NULL — timestamp (acknowledged_at) survives manager account deletion; audit trail preserved with who-pointer cleared (08-01)
- NULL acknowledged_at = unacknowledged state — no separate boolean status column needed; presence of timestamp is the status (08-01)
- Acknowledgment pair pattern: *_at TIMESTAMPTZ (when) + *_by UUID FK (who) — both nullable, both set atomically in one UPDATE (08-01)
- acknowledgeRecord()/acknowledgeRemote() accessible to manager/admin/owner — managers are primary users; admins included for operational coverage (08-02)
- Idempotent acknowledge pattern: if *_at already set, return full current record without error — safe for frontend retry on network failure (08-02)
- acknowledgeRecord() validates late OR early before writing; acknowledgeRemote() validates is_remote flag — prevents misuse on wrong record types (08-02)
- localRecord state in AttendanceRecordDetail synced via useEffect from prop — allows optimistic update after acknowledge without triggering parent re-fetch; acknowledges are not time adjustments so onAdjusted is not called (08-03)
- acknowledgeRecord/acknowledgeRemote silently ignore catch errors — idempotent backend safe for silent retry (08-03)
- Remote toggle resets in openCamera() rather than on submission — prevents stale checkbox state if user cancels mid-flow (08-03)
- Remote badge color bg-blue-100 text-blue-700 used consistently across all three views (admin table, record detail, employee history) — distinct from all existing status badge colors (08-03)
- [Phase 08]: Phase 8 human verification passed — all 7 scenarios confirmed with no code changes required post-delivery
- DataRefreshService is a separate injectable service (not merged into AttendanceService) — keeps refresh logic isolated and independently testable (09-01)
- handleRefresh reloads records via listRecords() after triggerRefresh() resolves — absent rows inserted by backend become visible immediately without manual page reload (09-02)
- Status filter dropdown always rendered (not role-gated) — admin and manager both benefit from filtering by late/early/absent statuses (09-02)
- absent_afternoon filter uses client-side logic: check_in_at !== null && check_out_at === null — no backend query change needed (09-02)
- absent_morning inserted for today (no check-in yet), absent inserted for yesterday (no record at all) — two distinct temporal windows in runRefresh() (09-01)
- Upsert with ignoreDuplicates=true makes runRefresh idempotent — second call re-stamps last_refresh_at but does not duplicate absent rows (09-01)
- Only active, non-deleted employees (is_active=true AND deleted_at IS NULL) are candidates for absent records — soft-deleted employees excluded (09-01)
- Migration uses DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT to extend the CHECK constraint — standard PostgreSQL pattern for altering check constraints (09-01)
- PaginationDto @Transform guards normalise limit=0 to 20 and omitted params to defaults — no 400 rejection for common client omissions (10-01)
- Default parameter pagination = new PaginationDto() in listRecords service — all existing callers continue to work without modification (10-01)
- Early-return paths (no divisions, no employees) updated to return paginated shape { data:[], total:0, page, limit } for consistent response contract (10-01)
- { count: 'exact' } on Supabase select() for total — reflects full filtered month count, not just current page (10-01)
- Shared DTO pattern: backend/src/common/dto/ for reusable request/response contracts across controllers (10-01)
- In-memory slice for getMonthlyReport pagination: fetch all records from DB for stats accuracy, slice array in-memory for page — avoids second DB query (10-02)
- exportCsv passes limit=100000 internal pagination to bypass @Max(100) HTTP constraint — all records fetched for CSV export without HTTP contract change (10-02)
- PaginationControls is a shared dumb component accepting page/limit/total/onPageChange — no API coupling (10-03)
- listUsers(token, 1, 1000) used for full user list in attendance usersMap and divisions page — avoids separate endpoint (10-03)
- refreshUsers(p) accepts explicit page param so mutations can reset to page 1 without stale closure (10-03)
- resolveIpRestriction() private helper centralises all IP logic — disabled mode, empty allowlist, is_remote bypass, CIDR matching, enforce-block, log-only violation — replaces two identical inline blocks (11-01)
- ip_violation column on attendance_records marks both check-in and check-out violations in log-only mode (11-01)
- ipAllowlist removed from UpdateCompanySettingsDto — dedicated POST/DELETE endpoints manage entries atomically (11-01)
- checkOut uses isRemote=false — check-out has no is_remote flag (11-01)
- Empty allowlist = no restriction (pass-through) — consistent with existing design decision from Phase 3 (11-01)
- settings state removed from AdminSettingsPage — only ipMode and allowlist needed for rendering; CompanySettings is only used to seed those two states on mount (11-02)
- ipAllowlist removed from updateCompanySettings() — consistent with backend 11-01 decision that dedicated POST/DELETE endpoints manage entries atomically (11-02)
- handleActionButton() replaces direct openCamera() call on main action button — IP check gate sits between user intent and camera opening, so employees see IP status before taking a photo (11-03)
- IP check failure (network/auth error) falls through to camera — infrastructure failure must not block employees from checking in (11-03)
- ip-blocked state shows remote work hint inline rather than auto-transitioning — user must explicitly tick checkbox and retry, making bypass intent explicit (11-03)
- Phase 11 E2E human verification passed — all 20 verification steps confirmed; no code changes required post-delivery (11-04)
- [Phase 12-ui-polish]: JSX.Element return type replaced with ReactElement from react (imported as type) — jsx: react-jsx tsconfig does not expose global JSX namespace
- [Phase 12-ui-polish]: ElementType from react used for icon field in StatusConfig instead of React.ElementType — avoids React namespace import while keeping TypeScript strict
- EmployeeHistoryModal placed at page level above conditional summary block — Dialog must always mount in DOM to avoid animation/state issues (12-03)
- Shadcn dialog.tsx has implicit peer dependency on button.tsx not declared in install output — discovered via TS2307 compile error, resolved via Rule 3 auto-fix (12-03)
- Employee name fetched from first listRecords() response (users.full_name join) on detail page — no separate users API round-trip needed (12-04)
- e.stopPropagation() on Link in employee name cell — prevents parent row's onSelectRecord from firing when navigating to employee detail (12-04)
- Page number resets to 1 when year or month changes on Employee Detail page — avoids stale pagination state (12-04)
- [Phase 12-ui-polish]: Clock initialized immediately before setInterval to prevent 1-second blank display on mount
- [Phase 12-ui-polish]: Separate useEffect for clock tick keeps concerns isolated from user-fetch effect
- Phase 12 E2E human verification passed — all 31 verification steps confirmed; two additional bug fixes (absent_morning upgrade logic, employee name link colour) applied post-delivery
- [Phase 13-ui-redesign]: Tailwind v4 CSS-based config used (@theme inline block) instead of tailwind.config.ts — project has no JS config file
- [Phase 13-ui-redesign]: brand-primary (#4848e5) and background-light (#f6f6f8) added as CSS custom properties in @theme
- [Phase 13-ui-redesign]: Hardcoded #4848e5 in JSX classes for Stitch-exact match (not using Tailwind's indigo-600)

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
- Run 010_remote_acknowledgment.sql migration in Supabase SQL editor before testing Phase 8 endpoints (adds is_remote + 4 ack columns)
- Run 011_data_refresh.sql migration in Supabase SQL editor before testing Phase 9 Data Refresh endpoint (extends check_in_status + adds last_refresh_at to companies)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 13-05-PLAN.md — Modals + Global Color Migration + Consistency (Phase 13 complete)
Resume file: None
Next: Phase 13 complete. No further plans.
