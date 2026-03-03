---
phase: 07-employee-lifecycle-timezone
plan: 02
subsystem: api
tags: [nestjs, supabase, users, rbac, soft-delete, timezone]

# Dependency graph
requires:
  - phase: 06-division-architecture
    provides: divisions table with manager_id FK; DivisionsModule; division_id on users

provides:
  - DELETE /users/:id soft-delete (removes Supabase Auth, sets is_active=false, row kept for history)
  - PATCH /users/:id now accepts fullName and timezone fields
  - POST /users with manager role JWT validates division ownership before creating employee
  - GET /users joins division + nested manager full_name for frontend Manager column
  - validateManagerDivisionOwnership() service method for clean separation of concerns

affects:
  - 07-03 (frontend employee lifecycle UI consuming these endpoints)
  - 08-remote-acknowledgment (attendance records remain linked to soft-deleted users)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Soft-delete pattern: remove Auth account + set is_active=false; DB row preserved for FK history
    - Manager-scoped create: controller delegates division ownership check to service layer
    - FK join in listUsers: Supabase nested join users!divisions_manager_id_fkey for manager name

key-files:
  created: []
  modified:
    - backend/src/users/dto/update-user.dto.ts
    - backend/src/users/users.service.ts
    - backend/src/users/users.controller.ts

key-decisions:
  - "Soft-delete preserves public.users row: attendance_records join on user_id and need full_name for historical display even after employee leaves"
  - "Owner role is protected from deletion at service layer — BadRequestException thrown before any Auth call"
  - "Manager role permitted on POST /users only for employee role creation; must supply a divisionId from their own managed divisions (ForbiddenException otherwise)"
  - "listUsers Supabase select uses nested FK alias users!divisions_manager_id_fkey — avoids second round-trip for manager name"
  - "validateManagerDivisionOwnership lives in UsersService (not controller) — controller stays thin, delegation pattern consistent with codebase"
  - "timezone field accepts string | null in UpdateUserDto — null explicitly clears per-user timezone override (falls back to company timezone)"

patterns-established:
  - "Soft-delete pattern: Auth.admin.deleteUser() then is_active=false update — Auth deletion is irreversible so is_active must be set even on updateError"
  - "Manager scope validation delegated to service before createUser() call — controller gatekeeper + service validator separation"

requirements-completed: [EMPL-01, EMPL-02, EMPL-03, EMPL-04]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 7 Plan 02: Employee Lifecycle Backend Summary

**NestJS UsersModule extended with soft-delete (Auth removal + is_active=false), fullName/timezone PATCH, manager-scoped employee creation with division ownership validation, and division-manager join on GET /users**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-03T13:54:18Z
- **Completed:** 2026-03-03T13:55:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- DELETE /users/:id removes Supabase Auth account then sets is_active=false; DB row retained so attendance records display employee name
- PATCH /users/:id extended to accept fullName and timezone (IANA string or null to clear per-user override)
- POST /users now allows manager role but validates division ownership — ForbiddenException if division is not managed by caller
- GET /users joins divisions with nested manager full_name via FK alias for EMPL-04 frontend Manager column

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DTOs and add deleteUser service method** - `37bc83f` (feat)
2. **Task 2: Add DELETE endpoint and manager-scoped POST to UsersController** - `a7a8e68` (feat)

## Files Created/Modified

- `backend/src/users/dto/update-user.dto.ts` - Added fullName and timezone optional fields with IsString validators
- `backend/src/users/users.service.ts` - Added deleteUser(), validateManagerDivisionOwnership(), updated updateUser() and listUsers()
- `backend/src/users/users.controller.ts` - Added DELETE /users/:id, updated POST /users with manager role gate

## Decisions Made

- Owner role blocked from deletion at service layer before any Auth call is made — prevents accidental loss of company access
- Manager role permitted to create employees only with a valid divisionId from their own divisions; missing divisionId = BadRequestException (not ForbiddenException) since it's a required field for manager context
- listUsers() uses nested Supabase FK join `users!divisions_manager_id_fkey` to return manager name in single query without a second round-trip
- validateManagerDivisionOwnership() placed in UsersService to keep controller thin — service handles both business logic and data validation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four EMPL backend endpoints implemented and TypeScript-clean
- Ready for 07-03 frontend Employee Lifecycle UI (delete button, fullName/timezone edit fields, manager column display)
- No blockers

---
*Phase: 07-employee-lifecycle-timezone*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: backend/src/users/dto/update-user.dto.ts
- FOUND: backend/src/users/users.service.ts
- FOUND: backend/src/users/users.controller.ts
- FOUND: .planning/phases/07-employee-lifecycle-timezone/07-02-SUMMARY.md
- FOUND commit: 37bc83f (Task 1)
- FOUND commit: a7a8e68 (Task 2)
