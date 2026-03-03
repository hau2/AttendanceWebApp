---
phase: 06-division-architecture
plan: "02"
subsystem: api
tags: [nestjs, supabase, divisions, crud, rls, multi-tenant]

# Dependency graph
requires:
  - phase: 06-01
    provides: divisions table migration + users.division_id FK + RLS policies

provides:
  - DivisionsService with createDivision, listDivisions, updateDivision, deleteDivision
  - DivisionsController with POST/GET/PATCH/DELETE /divisions endpoints
  - DivisionsModule exported for future injection (Plan 03 injects DivisionsService into AttendanceService)
  - AppModule updated to include DivisionsModule

affects:
  - 06-03 (AttendanceService injects DivisionsService for manager scoping)
  - 06-04 (frontend Divisions management page consumes these endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Role guard inline in controller (admin/owner for writes, admin/owner/executive for reads)
    - Sparse update pattern (only defined fields in updateData)
    - UNIQUE violation detection via Supabase error code 23505
    - Employee count pre-check before division deletion (ConflictException with count message)
    - DivisionsModule exports DivisionsService so downstream modules can inject without re-declaring

key-files:
  created:
    - backend/src/divisions/divisions.service.ts
    - backend/src/divisions/divisions.controller.ts
    - backend/src/divisions/divisions.module.ts
    - backend/src/divisions/dto/create-division.dto.ts
    - backend/src/divisions/dto/update-division.dto.ts
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "DivisionsModule exports DivisionsService so Plan 03 can inject it into AttendanceService without reimporting"
  - "listDivisions uses Supabase FK join alias users!divisions_manager_id_fkey to fetch manager full_name in single query"
  - "deleteDivision counts users.division_id before deletion — ConflictException includes employee count for clear UX"
  - "countError on pre-delete count query treated as NotFoundException — division not found in company scope"

patterns-established:
  - "Role guard inline: !['admin', 'owner'].includes(role) throws ForbiddenException — consistent with v1 pattern"
  - "Sparse updateData: only fields !== undefined included, always add updated_at — prevents wiping data on partial patch"

requirements-completed: [DIVN-01, DIVN-02, DIVN-03, DIVN-04, DIVN-07]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 6 Plan 02: Division Backend API Summary

**NestJS DivisionsModule with full CRUD (POST/GET/PATCH/DELETE /divisions) — admin-scoped division management with employee-assignment guard on delete**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-03T07:04:35Z
- **Completed:** 2026-03-03T07:05:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created DivisionsService with createDivision, listDivisions (with manager full_name join), updateDivision (sparse), and deleteDivision (guarded)
- Created DivisionsController with POST/GET/PATCH/DELETE endpoints and role-based access (admin/owner for writes, admin/owner/executive for GET)
- Created DivisionsModule with DivisionsService exported so Plan 03 (AttendanceService) can inject it via DI
- Registered DivisionsModule in AppModule — endpoints are live on backend startup

## Task Commits

Each task was committed atomically:

1. **Task 1: DivisionsService with CRUD methods** - `7c93685` (feat)
2. **Task 2: DivisionsController, DivisionsModule, and AppModule registration** - `3902f0a` (feat)

## Files Created/Modified

- `backend/src/divisions/divisions.service.ts` - CRUD service: create, list with join, sparse update, employee-count-guarded delete
- `backend/src/divisions/divisions.controller.ts` - REST controller with JwtAuthGuard and inline role checks
- `backend/src/divisions/divisions.module.ts` - NestJS module; exports DivisionsService for cross-module injection
- `backend/src/divisions/dto/create-division.dto.ts` - CreateDivisionDto with name + optional managerId
- `backend/src/divisions/dto/update-division.dto.ts` - UpdateDivisionDto with optional name + nullable managerId
- `backend/src/app.module.ts` - Added DivisionsModule to imports array

## Decisions Made

- DivisionsModule exports DivisionsService — Plan 03 (AttendanceService) needs to inject it for division-based manager scoping without re-declaring the service
- listDivisions uses `users!divisions_manager_id_fkey(id, full_name)` Supabase FK join alias — fetches manager data in a single query without N+1
- deleteDivision counts employees first: throws ConflictException with count message if > 0, so the UI can show a meaningful error ("3 employees still assigned, reassign first")
- countError on the pre-delete count query treated as NotFoundException — if Supabase errors on a company_id + division_id count, the division is not accessible in this tenant's scope
- Sparse update pattern: build updateData object with only defined fields + always append updated_at — prevents accidental null-wiping on partial PATCH

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The divisions table and RLS policies were created in Plan 06-01. Backend picks up automatically on next restart.

## Next Phase Readiness

- POST/GET/PATCH/DELETE /divisions endpoints are fully operational
- DivisionsService exported from DivisionsModule — Plan 06-03 can inject it immediately
- Plan 06-03 (AttendanceService manager scoping update) and Plan 06-04 (frontend Divisions page) both unblocked

## Self-Check: PASSED

All 5 created files verified present on disk. Both task commits (7c93685, 3902f0a) confirmed in git log.

---
*Phase: 06-division-architecture*
*Completed: 2026-03-03*
