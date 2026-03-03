---
phase: 05-monitoring-reporting
plan: "03"
subsystem: ui
tags: [nextjs, react, tailwind, attendance, manager, team-summary]

# Dependency graph
requires:
  - phase: 05-01
    provides: GET /attendance/reports/team-summary backend endpoint with manager scoping
  - phase: 04-02
    provides: admin attendance page with AttendanceRecordDetail modal and adjustment flow
provides:
  - TeamSummary interface and getTeamSummary() API helper in attendance.ts
  - Manager team summary card on admin attendance page (Total Records, Late Check-ins, Punctuality Rate)
  - Manager-filtered employee dropdown showing only assigned employees
affects: [05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional UI rendering by role — manager sees team summary card; admin/owner see nothing extra
    - Client-side user filtering by manager_id === currentUserId for dropdown scoping

key-files:
  created: []
  modified:
    - frontend/src/lib/api/attendance.ts
    - frontend/src/app/(app)/admin/attendance/page.tsx

key-decisions:
  - "Manager employee dropdown filtered client-side (manager_id === currentUserId) — backend already scopes records; client-side filter gives consistent UX in dropdown without an extra API endpoint"
  - "Team summary fetch added inside year/month/role useEffect — userRole added as dependency so fetch triggers after role is set on initial load"
  - "teamSummary null-guarded in JSX — card only renders when data available; silently suppresses on API error"

patterns-established:
  - "Role-conditional UI block: {userRole === 'manager' && data && (<Card/>)} — render manager-only KPI cards above main content"

requirements-completed: [MNGR-01, MNGR-02, MNGR-03, MNGR-04, MNGR-05, MNGR-06]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 5 Plan 03: Manager Monitoring View Summary

**Team summary card (Total Records, Late Check-ins, Punctuality Rate) added to admin attendance page with manager-scoped employee dropdown and getTeamSummary() API helper**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-03T00:12:42Z
- **Completed:** 2026-03-03T00:14:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `TeamSummary` interface and `getTeamSummary(year, month)` API helper calling GET /attendance/reports/team-summary
- Rendered 3-column team summary card (Total Records, Late Check-ins, Punctuality Rate) above the month controls for manager role only
- Filtered employee dropdown to show only users with `manager_id === currentUserId` when role is manager; admin/owner see all users unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getTeamSummary API helper** - `edeccab` (feat)
2. **Task 2: Team summary card and manager-filtered employee dropdown** - `23064c7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/lib/api/attendance.ts` - Added TeamSummary interface and getTeamSummary() function after adjustRecord
- `frontend/src/app/(app)/admin/attendance/page.tsx` - Added teamSummary/currentUserId state, team summary fetch, manager-filtered dropdown, and team summary card JSX

## Decisions Made
- Manager employee dropdown filtered client-side (manager_id === currentUserId) — backend already scopes records via the 05-01 backend; client-side filter gives consistent UX without an extra API call
- Team summary fetch placed inside the year/month/filterUserId useEffect with `userRole` added as a dependency so the fetch fires correctly after role is set on initial mount
- Team summary card silently suppresses on API error (catches and sets null) — graceful degradation for empty months or network issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Manager monitoring view complete; managers can see team KPIs and their employees' records
- Ready for Plan 05-04 (Executive Dashboard frontend) and Plan 05-05 (CSV export + reporting frontend)

---
*Phase: 05-monitoring-reporting*
*Completed: 2026-03-03*

## Self-Check: PASSED
- FOUND: frontend/src/lib/api/attendance.ts
- FOUND: frontend/src/app/(app)/admin/attendance/page.tsx
- FOUND: .planning/phases/05-monitoring-reporting/05-03-SUMMARY.md
- FOUND: commit edeccab (Task 1)
- FOUND: commit 23064c7 (Task 2)
