---
phase: 09-advanced-monitoring
plan: "02"
subsystem: ui
tags: [nextjs, react, tailwind, attendance, filters, data-refresh]

# Dependency graph
requires:
  - phase: 09-01
    provides: POST /attendance/refresh endpoint + GET /company/settings with last_refresh_at
provides:
  - triggerRefresh() API function in attendance.ts
  - getCompanySettings() API function in company.ts returning last_refresh_at
  - Data Refresh button on Admin Attendance page (admin/owner only)
  - last_refresh_at timestamp display below Refresh button
  - Status filter dropdown with 5 options: Late, Early Leave, Absent, Absent Morning, Absent Afternoon
  - Extended statusBadge map in AttendanceRecordTable for absent/absent_morning
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fetch company settings on mount (admin/owner only) via getCompanySettings(token) + setLastRefreshAt"
    - "handleRefresh pattern: triggerRefresh() → setLastRefreshAt → listRecords() reload → setRecords"
    - "filterStatus composable with existing name/division/manager client-side filters"
    - "hasFilters guard includes filterStatus for conditional Clear Filters button display"

key-files:
  created: []
  modified:
    - frontend/src/lib/api/attendance.ts
    - frontend/src/lib/api/company.ts
    - frontend/src/app/(app)/admin/attendance/page.tsx
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx

key-decisions:
  - "triggerRefresh() reads token from localStorage via existing getToken() helper — consistent with all other attendance API functions"
  - "getCompanySettings(token) accepts token as parameter (unlike attendance functions) — matches company.ts existing pattern using authHeaders() from getStoredToken()"
  - "lastRefreshAt initially fetched on mount for admin/owner; updated optimistically after successful refresh without re-fetching settings"
  - "handleRefresh reloads records after successful refresh (listRecords re-call) — ensures absent rows inserted by backend are visible immediately"
  - "Status filter dropdown always visible (not role-gated) — simpler UX since status filter is relevant to admin and manager alike"
  - "absent_afternoon filter uses client-side logic: check_in_at !== null && check_out_at === null — has checked in but has not checked out yet"

patterns-established:
  - "Data Refresh button pattern: button → disabled state → POST → update timestamp + reload records"
  - "Status badge extension: add new statuses to map in statusBadge() without changing fallback logic"

requirements-completed:
  - RFSH-01
  - RFSH-04
  - FLTR-01
  - FLTR-02
  - FLTR-03
  - FLTR-04
  - FLTR-05

# Metrics
duration: 2min
completed: "2026-03-05"
---

# Phase 9 Plan 02: Advanced Monitoring Frontend Summary

**Data Refresh button + 5-option status filter dropdown wired to POST /attendance/refresh and client-side record filtering on the Admin Attendance page**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-05T13:55:25Z
- **Completed:** 2026-03-05T13:57:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended AttendanceRecord.check_in_status type with 'absent' | 'absent_morning' + added triggerRefresh() to attendance.ts
- Added getCompanySettings() to company.ts exposing last_refresh_at field
- Admin Attendance page now shows Data Refresh button (admin/owner) with loading state, error display, and last-refresh timestamp
- Status filter dropdown with 5 options (Late, Early Leave, Absent, Absent Morning, Absent Afternoon) composes with existing name/division/manager filters
- AttendanceRecordTable statusBadge extended with gray (absent) and purple (absent_morning) styles
- Next.js build passes without TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update API libs — triggerRefresh + last_refresh_at** - `1ae39e5` (feat)
2. **Task 2: Admin attendance page — Refresh button + status filter** - `1805089` (feat)

## Files Created/Modified
- `frontend/src/lib/api/attendance.ts` - check_in_status extended; RefreshResult interface; triggerRefresh() function
- `frontend/src/lib/api/company.ts` - CompanySettings interface; getCompanySettings() function
- `frontend/src/app/(app)/admin/attendance/page.tsx` - Data Refresh button, last_refresh_at display, filterStatus state, handleRefresh(), status filter dropdown
- `frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx` - statusBadge map extended with absent/absent_morning

## Decisions Made
- getCompanySettings() accepts explicit token parameter (vs localStorage) — matches company.ts authHeaders() pattern rather than attendance.ts getToken() pattern
- handleRefresh reloads records via listRecords after each refresh — ensures absent rows inserted by backend are visible without requiring manual page reload
- Status filter dropdown is always rendered (not role-gated) — both admin and manager benefit from filtering by status

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9 (Advanced Monitoring) feature delivery complete: backend (09-01) + frontend (09-02)
- Admin/Owner can trigger Data Refresh to insert absent records and view the last refresh timestamp
- Status filter dropdown enables quick triage of late/early/absent employees
- No blockers for UI Polish phase (10)

## Self-Check: PASSED

All created/modified files confirmed present. All task commits verified in git log.

---
*Phase: 09-advanced-monitoring*
*Completed: 2026-03-05*
