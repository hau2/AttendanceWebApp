---
phase: 03-attendance-core
plan: "03"
subsystem: api
tags: [nestjs, cron, schedule, supabase, attendance]

requires:
  - phase: 03-01
    provides: attendance_records table with missing_checkout + source columns; SupabaseService getClient()

provides:
  - AttendanceCronService scheduled at 00:05 UTC daily marks missing_checkout=true for unclosed check-ins
  - Per-company timezone-aware work_date computation using en-CA locale

affects: [03-04, 03-05, 04-01]

tech-stack:
  added: ["@nestjs/schedule ^6.1.1"]
  patterns: ["Per-company timezone loop: fetch all companies, compute todayInCompanyTz via toLocaleDateString('en-CA'), batch update per company"]

key-files:
  created:
    - backend/src/attendance/attendance-cron.service.ts
  modified:
    - backend/src/attendance/attendance.module.ts
    - backend/src/app.module.ts
    - backend/package.json

key-decisions:
  - "@Cron('5 0 * * *') runs at 00:05 UTC — catches midnight for any timezone; companies east of UTC will have already crossed midnight, companies west have extra buffer"
  - "eq('missing_checkout', false) filter makes cron idempotent — already-marked records are skipped even if cron runs multiple times"
  - "source='system' set on update — distinguishes auto-marked records from admin adjustments for audit purposes"

patterns-established:
  - "Timezone-per-company iteration: always loop companies and compute local date individually — never use a single global date for multi-tenant operations"

requirements-completed: [ATTN-08]

duration: 5min
completed: 2026-03-02
---

# Phase 3 Plan 03: Missing Checkout Cron Summary

**NestJS scheduled cron at 00:05 UTC daily auto-marks attendance_records as missing_checkout=true per company timezone using @nestjs/schedule**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T03:44:00Z
- **Completed:** 2026-03-02T03:49:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Installed @nestjs/schedule and wired ScheduleModule.forRoot() into AppModule
- Created AttendanceCronService with per-company timezone-aware missing checkout detection
- Cron is fully idempotent — eq('missing_checkout', false) guard prevents double-updates

## Task Commits

Each task was committed atomically:

1. **Task 1: AttendanceCronService for missing checkout auto-mark** - `8f0b20b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/attendance/attendance-cron.service.ts` - Scheduled cron service; @Cron('5 0 * * *'); per-company timezone loop
- `backend/src/attendance/attendance.module.ts` - Added AttendanceCronService to providers array
- `backend/src/app.module.ts` - Added ScheduleModule.forRoot() to imports
- `backend/package.json` - Added @nestjs/schedule ^6.1.1 dependency

## Decisions Made
- Cron at 00:05 UTC (not midnight): gives a 5-minute buffer after UTC midnight — enough for any timezone east of UTC to have crossed midnight
- `source='system'` distinguishes auto-marks from manual admin adjustments in the audit trail
- `eq('missing_checkout', false)` makes the cron idempotent without needing a "last run" timestamp

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ATTN-08 satisfied: system auto-handles missing checkouts without human intervention
- missing_checkout flag available for Phase 4 admin adjustment screens and Phase 5 reporting dashboards
- source='system' column populated correctly for audit trail queries

---
*Phase: 03-attendance-core*
*Completed: 2026-03-02*
