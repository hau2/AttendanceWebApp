---
phase: 05-monitoring-reporting
plan: "01"
subsystem: api
tags: [nestjs, supabase, attendance, manager, scoping, reporting]

# Dependency graph
requires:
  - phase: 03-attendance-core
    provides: listRecords() service method and attendance_records table
  - phase: 02-workforce-configuration
    provides: manager_id column on users table (003_workforce_config.sql)
provides:
  - manager-scoped listRecords() filtering attendance records to assigned employees
  - getTeamSummary() returning KPI snapshot (total, late, punctualityRate, monthlyBreakdown)
  - GET /attendance/reports/team-summary endpoint accessible by admin/manager/owner
affects: [05-02, 05-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Manager scope via sub-query on users table (eq manager_id) before attendance query
    - Empty-early-return when manager has zero assigned employees
    - Daily breakdown via Map<date, {present, late}> then Array.from().sort()

key-files:
  created: []
  modified:
    - backend/src/attendance/attendance.service.ts
    - backend/src/attendance/attendance.controller.ts

key-decisions:
  - "listRecords() optional managerId param — when provided, fetches employee IDs where manager_id=managerId then filters .in('user_id', employeeIds)"
  - "Empty employee list returns [] immediately without querying attendance_records — avoids .in('user_id', []) Supabase behavior"
  - "getTeamSummary uses manager userId as managerId — admin/owner calling endpoint sees their own managed employees (typically empty)"
  - "reports/team-summary route placed before :id param routes — avoids NestJS route conflict parsing 'team-summary' as an ID"
  - "punctualityRate = 100 when total = 0 — sensible default for empty months"

patterns-established:
  - "Manager scoping: sub-query users table for employee IDs, then .in() on attendance query"
  - "Daily breakdown: Map accumulation then Array.from().sort() by date string"

requirements-completed: [MNGR-01, MNGR-02, MNGR-03, MNGR-04, MNGR-05, MNGR-06]

# Metrics
duration: 1min
completed: 2026-03-03
---

# Phase 5 Plan 01: Manager-Scoped Attendance Records and Team Summary API

**Manager scoping added to listRecords() and new getTeamSummary() KPI endpoint delivering total/late/punctualityRate/dailyBreakdown via GET /attendance/reports/team-summary**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T00:05:38Z
- **Completed:** 2026-03-03T00:06:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `listRecords()` now accepts optional `managerId`; when role=manager, controller auto-passes the manager's userId so records are scoped to their assigned employees only
- Admin/owner callers receive unchanged behavior (managerId=undefined, full company records returned)
- New `getTeamSummary()` method computes total check-ins, late count, punctuality rate percentage, and day-by-day breakdown for a manager's team
- New `GET /attendance/reports/team-summary` endpoint accessible by admin/manager/owner roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Manager-scoped listRecords and getTeamSummary service methods** - `ac54164` (feat)
2. **Task 2: Manager-scoped controller endpoint + team summary route** - `7cc4cd1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/attendance/attendance.service.ts` - Added managerId param to listRecords(); added getTeamSummary() method
- `backend/src/attendance/attendance.controller.ts` - listRecords passes managerId when role=manager; added GET reports/team-summary endpoint

## Decisions Made
- `managerId` is optional in `listRecords()` — when undefined (admin/owner callers), full company-scope query runs unchanged, preserving existing behavior
- Early-return on empty employee list prevents sending `.in('user_id', [])` to Supabase which could return unintended results
- `getTeamSummary` uses `managerId = userId` for all roles — admins/owners who call this endpoint see data for employees they personally manage (expected to be empty for most admins)
- Route `reports/team-summary` declared before `records/:id` to prevent NestJS treating "team-summary" as an ID parameter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Manager scoping backend complete; Phase 5 Plan 02 can build manager dashboard frontend consuming GET /attendance/records (auto-scoped) and GET /attendance/reports/team-summary
- Both endpoints enforce JWT auth and role checks; frontend needs to pass valid manager JWT token

## Self-Check: PASSED

- attendance.service.ts: FOUND
- attendance.controller.ts: FOUND
- 05-01-SUMMARY.md: FOUND
- STATE.md: FOUND
- ROADMAP.md: FOUND
- Commit ac54164 (Task 1): FOUND
- Commit 7cc4cd1 (Task 2): FOUND
- Commit deb878e (docs): FOUND
- TypeScript compilation: PASS

---
*Phase: 05-monitoring-reporting*
*Completed: 2026-03-03*
