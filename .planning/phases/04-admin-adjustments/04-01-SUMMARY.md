---
phase: 04-admin-adjustments
plan: "01"
subsystem: api
tags: [nestjs, supabase, audit-trail, attendance, dto, class-validator]

# Dependency graph
requires:
  - phase: 03-attendance-core
    provides: attendance_records table, AttendanceService, AttendanceController

provides:
  - attendance_adjustments SQL migration (006) with audit table schema
  - AdjustRecordDto with ISO8601 time fields and required reason
  - adjustRecord() method in AttendanceService
  - PATCH /attendance/records/:id endpoint restricted to admin/owner

affects:
  - 04-admin-adjustments (plan 02 — frontend adjustment UI will call this endpoint)
  - 05-monitoring-reporting (adjustment audit trail visible in reports)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-field audit row insertion (one row per changed field with old/new values)
    - Role guard pattern at controller level with ForbiddenException
    - missing_checkout flag auto-cleared when check_out_at is set by admin

key-files:
  created:
    - backend/src/database/migrations/006_attendance_adjustments.sql
    - backend/src/attendance/dto/adjust-record.dto.ts
  modified:
    - backend/src/attendance/attendance.service.ts
    - backend/src/attendance/attendance.controller.ts

key-decisions:
  - "Per-field audit rows in attendance_adjustments — one row per changed field with old/value preserved; attendance_records holds only current values"
  - "old_value nullable in audit table — supports setting check_out_at on missing_checkout records where previous value was NULL"
  - "missing_checkout flag auto-cleared by service when check_out_at is adjusted by admin — prevents cron double-marking"
  - "PATCH /attendance/records/:id restricted to admin and owner only (not manager) — managers can view but not correct records in v1"
  - "source field set to 'admin' on adjustment — distinguishes manual corrections from employee actions (source='employee') and system cron (source='system')"

patterns-established:
  - "Audit trail pattern: before/after values stored in separate audit table; main record updated in-place"
  - "Role restriction at controller layer via inline role check before delegating to service"

requirements-completed: [ADJT-01, ADJT-02, ADJT-03]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 4 Plan 01: Admin Adjustments Backend Summary

**Immutable audit trail for admin attendance corrections: attendance_adjustments table, AdjustRecordDto, adjustRecord() service method, and PATCH /attendance/records/:id endpoint (admin/owner only)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-02T15:22:31Z
- **Completed:** 2026-03-02T15:24:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `attendance_adjustments` SQL migration with per-field audit schema (record_id FK, adjusted_by FK, field_name, old_value, new_value, reason, adjusted_at)
- Added `AdjustRecordDto` with required `reason` (max 500 chars) and optional ISO8601 `check_in_at`/`check_out_at`
- Added `adjustRecord()` to AttendanceService — validates at least one field provided, captures old values, updates attendance_records, inserts immutable audit rows per changed field
- Added `PATCH attendance/records/:id` controller endpoint restricted to admin/owner roles (403 for manager/employee)

## Task Commits

Each task was committed atomically:

1. **Task 1: attendance_adjustments SQL migration** - `73f1ac1` (feat)
2. **Task 2: AdjustRecordDto + adjustRecord() + PATCH endpoint** - `5a9d08d` (feat)

**Plan metadata:** *(docs commit to follow)*

## Files Created/Modified

- `backend/src/database/migrations/006_attendance_adjustments.sql` - Creates attendance_adjustments audit table with indexes on record_id, company_id, adjusted_by
- `backend/src/attendance/dto/adjust-record.dto.ts` - AdjustRecordDto with class-validator decorators
- `backend/src/attendance/attendance.service.ts` - Added adjustRecord() method and AdjustRecordDto import
- `backend/src/attendance/attendance.controller.ts` - Added PATCH records/:id endpoint, Patch/Param imports, AdjustRecordDto import

## Decisions Made

- Per-field audit rows: one attendance_adjustments row per changed field — allows granular history (e.g., "who changed check_in_at at what time") rather than a single row per adjustment operation
- `old_value` is TEXT nullable — audit table uses string representation of timestamps; NULL is valid when setting check_out_at on a missing_checkout record
- `missing_checkout` flag is auto-cleared in the service when `check_out_at` is set via admin adjustment — prevents the midnight cron job from double-marking the record
- Managers excluded from PATCH access — per spec, managers can view attendance records but only admins/owners correct them in v1
- `source` field updated to `'admin'` on adjustment — allows downstream reporting to distinguish employee, admin, and system-generated records

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Manual step required before this endpoint is testable:**
Run `006_attendance_adjustments.sql` in the Supabase SQL editor to create the `attendance_adjustments` table and indexes.

## Next Phase Readiness

- PATCH /attendance/records/:id is ready for frontend integration
- Plan 04-02 (frontend adjustment UI) can call this endpoint with `{ check_in_at?, check_out_at?, reason }` payload
- The migration must be applied to Supabase before running integration tests

## Self-Check: PASSED

- FOUND: backend/src/database/migrations/006_attendance_adjustments.sql
- FOUND: backend/src/attendance/dto/adjust-record.dto.ts
- FOUND: .planning/phases/04-admin-adjustments/04-01-SUMMARY.md
- FOUND: commit 73f1ac1 (Task 1)
- FOUND: commit 5a9d08d (Task 2)

---
*Phase: 04-admin-adjustments*
*Completed: 2026-03-02*
