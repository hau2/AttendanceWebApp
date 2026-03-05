---
phase: 09-advanced-monitoring
plan: 01
subsystem: api
tags: [nestjs, supabase, attendance, data-refresh, absent, absent_morning, postgresql]

# Dependency graph
requires:
  - phase: 08-remote-work-acknowledgment-flow
    provides: attendance_records schema with is_remote and acknowledgment columns
  - phase: 03-attendance-core
    provides: attendance_records table, check_in_status constraint, cron service pattern
provides:
  - POST /attendance/refresh endpoint (admin/owner only)
  - DataRefreshService with idempotent runRefresh(companyId)
  - DB migration 011 extending check_in_status to include absent + absent_morning
  - companies.last_refresh_at column tracking when refresh was last run
  - GET /company/settings returns last_refresh_at for frontend display
affects: [09-advanced-monitoring, frontend-data-refresh-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Idempotent upsert pattern with ignoreDuplicates: true for system-generated attendance rows
    - Company-timezone-aware date computation (toLocaleDateString('en-CA', { timeZone })) reused from cron service
    - Role-gate at controller level (admin/owner only) then service delegation — thin controller pattern

key-files:
  created:
    - backend/src/database/migrations/011_data_refresh.sql
    - backend/src/attendance/data-refresh.service.ts
  modified:
    - backend/src/attendance/attendance.controller.ts
    - backend/src/attendance/attendance.module.ts
    - backend/src/company/company.service.ts

key-decisions:
  - "DataRefreshService is a separate injectable service (not merged into AttendanceService) — keeps refresh logic isolated and independently testable"
  - "absent_morning inserted for today (no check-in yet), absent inserted for yesterday (no record at all) — two distinct temporal windows"
  - "Upsert with ignoreDuplicates=true makes runRefresh idempotent — second call re-stamps last_refresh_at but does not duplicate absent rows"
  - "Only active, non-deleted employees (is_active=true AND deleted_at IS NULL) are candidates for absent records — soft-deleted employees excluded"
  - "Migration uses DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT to extend the CHECK constraint — standard PostgreSQL pattern for altering check constraints"

patterns-established:
  - "Refresh pattern: fetch company TZ → compute date strings → fetch existing records → set-diff → upsert missing rows → update timestamp"
  - "source='system' on auto-inserted rows distinguishes system records from employee check-ins"

requirements-completed: [RFSH-01, RFSH-02, RFSH-03, RFSH-04]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 9 Plan 01: Data Refresh Backend Summary

**Manual trigger endpoint (POST /attendance/refresh) that inserts absent_morning rows for today and absent rows for yesterday, with idempotent upsert and last_refresh_at tracking on the company record**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T04:36:29Z
- **Completed:** 2026-03-04T04:38:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- DB migration 011 extends check_in_status CHECK constraint to include 'absent' and 'absent_morning', and adds last_refresh_at TIMESTAMPTZ column to companies table
- DataRefreshService implements runRefresh(companyId) with timezone-aware date computation, employee filtering (active + not deleted), and idempotent upsert using ignoreDuplicates
- POST /attendance/refresh route added to AttendanceController, admin/owner only with 403 for other roles; DataRefreshService registered in AttendanceModule providers
- GET /company/settings now returns last_refresh_at so the frontend can display the last refresh timestamp

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration — extend check_in_status + add last_refresh_at** - `8fb36c5` (chore)
2. **Task 2: DataRefreshService + controller route + company settings update** - `bd73bba` (feat)

## Files Created/Modified

- `backend/src/database/migrations/011_data_refresh.sql` - Drops and recreates check_in_status constraint with absent/absent_morning values; adds last_refresh_at to companies
- `backend/src/attendance/data-refresh.service.ts` - DataRefreshService with runRefresh(companyId): company-tz date calc, employee diff, upsert absent/absent_morning rows, update last_refresh_at
- `backend/src/attendance/attendance.controller.ts` - Added DataRefreshService injection + POST refresh route (admin/owner only)
- `backend/src/attendance/attendance.module.ts` - Added DataRefreshService to providers array
- `backend/src/company/company.service.ts` - Added last_refresh_at to getSettings() select query

## Decisions Made

- DataRefreshService is a separate injectable service rather than a method on AttendanceService — keeps the refresh domain logic isolated
- absent_morning rows target today's date (employee hasn't checked in this morning); absent rows target yesterday (employee had no record at all that day)
- Upsert with `ignoreDuplicates: true` makes the endpoint idempotent — running it twice on the same day does not create duplicate absent rows, just re-stamps last_refresh_at
- Only employees with is_active=true AND deleted_at IS NULL are considered — soft-deleted employees are excluded from absent record generation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed cleanly on first attempt.

## User Setup Required

Run migration 011 in Supabase SQL editor before using the Data Refresh endpoint:
- `backend/src/database/migrations/011_data_refresh.sql`

This extends the check_in_status constraint and adds the last_refresh_at column to companies.

## Next Phase Readiness

- Backend Data Refresh API is complete and ready for frontend integration (Plan 09-02)
- POST /attendance/refresh returns `{ absentMorningCount, absentCount, lastRefreshAt }` — frontend can display these counts after triggering refresh
- GET /company/settings now includes last_refresh_at — frontend can show "Last refreshed: [timestamp]" in Admin panel

---
*Phase: 09-advanced-monitoring*
*Completed: 2026-03-04*
