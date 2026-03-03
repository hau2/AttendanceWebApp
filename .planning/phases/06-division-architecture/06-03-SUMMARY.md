---
phase: 06-division-architecture
plan: "03"
subsystem: api
tags: [nestjs, supabase, attendance, divisions, manager-scoping]

# Dependency graph
requires:
  - phase: 06-division-architecture/06-01
    provides: divisions table with manager_id FK, users.division_id FK, RLS policies
provides:
  - attendance.service.ts listRecords() scoped via divisions (not manager_id)
  - attendance.service.ts getTeamSummary() scoped via divisions
  - attendance.service.ts getMonthlyReport() scoped via divisions
  - update-user.dto.ts divisionId optional UUID field
  - users.service.ts updateUser() validates and assigns division_id
affects: [06-division-architecture, frontend-manager-views, reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-step division-based manager scoping: divisions WHERE manager_id → users WHERE division_id IN"
    - "Early-return empty result when manager has no divisions (before querying employees)"
    - "Tenant ownership validation before FK assignment (verify division.company_id before assigning)"

key-files:
  created: []
  modified:
    - backend/src/attendance/attendance.service.ts
    - backend/src/users/dto/update-user.dto.ts
    - backend/src/users/users.service.ts

key-decisions:
  - "Two-step division lookup in all manager-scoped attendance methods: Step 1 finds divisions WHERE manager_id = managerId; Step 2 finds users WHERE division_id IN divisionIds — consistent v2 scoping pattern"
  - "Early-return empty result at division step (not employee step) — avoids unnecessary second query when manager manages no divisions"
  - "Division ownership validated before assigning to user: BadRequestException if division.company_id != companyId — prevents cross-tenant assignment via service-role client"
  - "divisionId clearing (setting to null) not supported in Phase 6 — DIVN-05 only requires assign/reassign; unassign deferred"

patterns-established:
  - "Division-based manager scoping: all manager-restricted queries go through divisions table, never manager_id on users"

requirements-completed: [DIVN-05, DIVN-06, DIVN-07]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 6 Plan 03: Division Architecture - Attendance Scoping Summary

**Division-based manager scoping in three attendance methods (listRecords, getTeamSummary, getMonthlyReport) replacing v1 manager_id direct lookup, plus divisionId assignment via PATCH /users/:id with cross-tenant validation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T07:04:00Z
- **Completed:** 2026-03-03T07:05:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Migrated all three manager-scoped attendance queries from `users WHERE manager_id = managerId` to two-step division lookup (`divisions WHERE manager_id → users WHERE division_id IN`)
- Added `divisionId` optional UUID field to `UpdateUserDto` with `@IsUUID()` validation
- Added division ownership verification in `UsersService.updateUser()` before setting `division_id` (prevents cross-tenant assignment via service-role client)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update attendance service — division-based manager scoping** - `72003bc` (feat)
2. **Task 2: Add divisionId to UpdateUserDto and UsersService** - `823fe7b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/attendance/attendance.service.ts` - Three methods updated: listRecords, getTeamSummary, getMonthlyReport all use division-based scoping
- `backend/src/users/dto/update-user.dto.ts` - Added optional `@IsUUID() divisionId?: string` field
- `backend/src/users/users.service.ts` - Added InternalServerErrorException import; added divisionId handling with company ownership check in updateUser()

## Decisions Made
- Two-step division lookup is the canonical v2 manager scoping pattern — all three methods use identical Step 1 (find divisions) + Step 2 (find employees) sequence
- Early-return at division step avoids a second Supabase round-trip when manager manages no divisions
- Division ownership validated explicitly because service-role client bypasses RLS — BadRequestException('Division not found or does not belong to this company') thrown if cross-tenant attempt detected
- divisionId clearing (null assignment) not implemented in Phase 6; DIVN-05 only requires assign/reassign

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Division-based manager scoping is complete in all three attendance methods
- PATCH /users/:id now accepts divisionId for division assignment
- Frontend can be updated to pass divisionId when assigning employees to divisions (Phase 6 frontend plans)
- Admin/owner full-company scope is unchanged — no regression

## Self-Check: PASSED

All files verified present. All commits verified in git history.

---
*Phase: 06-division-architecture*
*Completed: 2026-03-03*
