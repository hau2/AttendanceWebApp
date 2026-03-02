---
phase: 02-workforce-configuration
plan: "04"
subsystem: api
tags: [nestjs, nextjs, supabase, rls, tailwind, shift-assignment, employee-shifts]

# Dependency graph
requires:
  - phase: 02-01
    provides: UsersModule with employee_shifts table from 003_workforce_config.sql migration
  - phase: 02-02
    provides: User management UI and users API helper with User type
  - phase: 02-03
    provides: ShiftsModule with ShiftsService, listShifts frontend helper, and /admin/shifts page

provides:
  - POST /shifts/assign — assign a shift to any user with an effective_date (tenant-scoped, validates both shift and user ownership)
  - GET /shifts/assignments/:userId — returns { activeShift, history } (active = latest effective_date <= today)
  - ShiftAssignmentsService exported from ShiftsModule for Phase 3 injection
  - AssignShiftModal on /admin/users — shows current active shift, history, and form to create new assignment

affects:
  - 03-attendance-core  # needs ShiftAssignmentsService.getActiveShift() to classify check-ins as on-time/late
  - 04-admin-adjustments
  - 05-monitoring-reporting

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Active shift resolution via ORDER BY effective_date DESC LIMIT 1 WHERE effective_date <= CURRENT_DATE
    - UNIQUE(user_id, effective_date) constraint prevents duplicate same-date assignments; ConflictException on violation
    - Tenant guard applied to both shift and user lookups before insert — prevents cross-tenant assignment
    - Plain Tailwind modal overlay (fixed inset-0) consistent with plan 02-02 pattern; no Shadcn Dialog dependency

key-files:
  created:
    - backend/src/shifts/shift-assignments.service.ts
    - backend/src/shifts/shift-assignments.controller.ts
    - backend/src/shifts/dto/assign-shift.dto.ts
    - frontend/src/app/(app)/admin/users/components/AssignShiftModal.tsx
  modified:
    - backend/src/shifts/shifts.module.ts
    - frontend/src/lib/api/shifts.ts
    - frontend/src/app/(app)/admin/users/components/UserTable.tsx
    - frontend/src/app/(app)/admin/users/page.tsx

key-decisions:
  - "Active shift = latest assignment with effective_date <= today (not last inserted); ORDER BY DESC LIMIT 1 query pattern"
  - "ShiftAssignmentsService exported from ShiftsModule so Phase 3 can inject it directly without re-querying the DB"
  - "ConflictException (409) on UNIQUE(user_id, effective_date) violation with descriptive message guiding admin to pick a different date"
  - "Tenant ownership of both shift and user verified before insert — prevents admin assigning a foreign-tenant shift to their user"
  - "listAssignments returns full history descending; frontend shows it in the modal as an audit trail"

patterns-established:
  - "Dual-lookup tenant guard: verify referenced entity belongs to companyId before inserting join record"
  - "Active record resolution: ORDER BY effective_date DESC LIMIT 1 WHERE effective_date <= CURRENT_DATE — used by Phase 3"

requirements-completed: [SHFT-03, SHFT-04]

# Metrics
duration: ~10min
completed: "2026-03-02"
---

# Phase 2 Plan 04: Shift Assignment Summary

**Shift assignment backend (POST /shifts/assign + GET /shifts/assignments/:userId with active shift resolution) and AssignShiftModal on /admin/users, completing Phase 2 workforce configuration**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-02T10:40:00Z
- **Completed:** 2026-03-02T10:42:00Z (tasks); checkpoint approved 2026-03-02
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 8

## Accomplishments

- NestJS ShiftAssignmentsService with assignShift, getActiveShift, and listAssignments — tenant-scoped with dual-entity ownership validation before insert
- Active shift resolution query: latest effective_date <= today, returning null (not an error) when no shift assigned yet — Phase 3 ready
- ShiftAssignmentsService exported from ShiftsModule so Phase 3 can inject it without re-importing
- AssignShiftModal on /admin/users page showing current active shift, full assignment history, and form to assign a new shift with effective date
- Human verification: all 11 steps passed (user table, role change, disable, CSV import, shift assign, shifts CRUD)

## Task Commits

Each task was committed atomically:

1. **Task 1: Shift assignment backend** - `fca6b19` (feat)
2. **Task 2: Frontend shift assignment** - `079c477` (feat)
3. **Task 3: Human verification checkpoint** - approved (no code commit)

## Files Created/Modified

- `backend/src/shifts/shift-assignments.service.ts` — assignShift (with tenant + entity validation), getActiveShift (active resolution), listAssignments (full history)
- `backend/src/shifts/shift-assignments.controller.ts` — POST /shifts/assign and GET /shifts/assignments/:userId under JwtAuthGuard
- `backend/src/shifts/dto/assign-shift.dto.ts` — AssignShiftDto: userId (IsUUID), shiftId (IsUUID), effectiveDate (IsDateString)
- `backend/src/shifts/shifts.module.ts` — added ShiftAssignmentsService to providers, ShiftAssignmentsController to controllers; exports ShiftsService + ShiftAssignmentsService
- `frontend/src/lib/api/shifts.ts` — added AssignShiftData, ShiftAssignment types; assignShift() and getUserShiftInfo() functions
- `frontend/src/app/(app)/admin/users/components/AssignShiftModal.tsx` — modal showing active shift info, history table, and assignment form
- `frontend/src/app/(app)/admin/users/components/UserTable.tsx` — added "Assign Shift" button per row with onAssignShift prop
- `frontend/src/app/(app)/admin/users/page.tsx` — wired assigningUser state, AssignShiftModal, and onAssignShift handler

## Decisions Made

- **Active shift = latest effective_date <= today.** A new assignment does not delete history; each assignment is a new row. Phase 3 uses getActiveShift() at check-in time.
- **ShiftAssignmentsService exported from ShiftsModule.** Phase 3 attendance module injects it via NestJS DI without duplicate DB queries.
- **ConflictException on UNIQUE(user_id, effective_date) violation.** The error message explicitly tells admin to choose a different date (UI surfaces it in the modal).
- **Dual tenant guard before insert.** Both the shift and the target user are verified to belong to companyId — prevents cross-tenant shift assignment.
- **getActiveShift returns null (not an error) when no assignment exists.** Employees without shifts can still be created; Phase 3 will handle the "no shift" case gracefully.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no new external service configuration required. Existing SQL migrations (003_workforce_config.sql and 002_workforce_rls.sql) already cover the employee_shifts table and RLS policies.

## Next Phase Readiness

Phase 3 (Attendance Core) prerequisites are fully met:
- `ShiftAssignmentsService.getActiveShift(companyId, userId)` exported and injectable — classifies check-ins as on-time, within-grace, or late
- All user roles (employee, manager) supported as attendance participants
- RLS policies enforce tenant isolation on employee_shifts

No blockers for Phase 3.

---
*Phase: 02-workforce-configuration*
*Completed: 2026-03-02*
