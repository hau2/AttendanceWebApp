---
phase: 02-workforce-configuration
plan: 01
subsystem: api
tags: [nestjs, supabase, rls, users, crud, jwt]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SupabaseService (@Global), JwtAuthGuard, JWT payload shape (userId/companyId/role), users table with RLS, shifts table
provides:
  - SQL migration 003 adding manager_id to users and employee_shifts table with indexes
  - RLS policy for employee_shifts tenant isolation
  - UsersModule with GET /users, POST /users, PATCH /users/:id, PATCH /users/:id/status
  - UsersService: listUsers, createUser (with auth rollback), updateUser (role/managerId + auth metadata sync), setUserStatus (with Supabase ban_duration sync)
affects: [03-attendance-core, 04-admin-adjustments, 05-monitoring-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auth ban_duration sync: disabled users have ban_duration='876000h' in Supabase Auth so they cannot obtain new tokens"
    - "app_metadata sync on role change: updateUserById called after DB update to keep JWT claims consistent"
    - "Optimistic rollback on createUser: auth user deleted if public.users insert fails (prevents orphaned auth records)"

key-files:
  created:
    - backend/src/database/migrations/003_workforce_config.sql
    - backend/src/database/rls/002_workforce_rls.sql
    - backend/src/users/dto/create-user.dto.ts
    - backend/src/users/dto/update-user.dto.ts
    - backend/src/users/users.service.ts
    - backend/src/users/users.controller.ts
    - backend/src/users/users.module.ts
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "ban_duration='876000h' (~100 years) used to ban disabled users in Supabase Auth — this prevents new token issuance; existing tokens expire naturally via JWT TTL"
  - "app_metadata updated on role change via auth.admin.updateUserById — ensures future login tokens carry the new role claim without requiring re-registration"
  - "SetStatusDto defined inline in users.controller.ts as a lightweight local class — not worth a separate file for a single boolean field"

patterns-established:
  - "UsersController scopes all queries to req.user.companyId from JwtAuthGuard-decoded JWT — tenant isolation enforced in service layer"
  - "catch (err: unknown) pattern throughout UsersService — consistent with Phase 1 strict-mode TypeScript"
  - "Rollback on createUser: auth.admin.deleteUser called if public.users insert fails"

requirements-completed: [USER-01, USER-02, USER-03, USER-05, USER-06]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 2 Plan 01: Workforce Configuration — Users Module Summary

**NestJS UsersModule with full CRUD (list/create/update/disable) backed by SQL migration adding manager_id to users and a new employee_shifts table with tenant-isolated RLS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T02:26:52Z
- **Completed:** 2026-03-02T02:28:52Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- SQL migration 003 adds manager_id self-referential FK to users and creates employee_shifts table with indexes and UNIQUE constraint on (user_id, effective_date)
- RLS policy for employee_shifts enforces tenant isolation using the same pattern as existing tables
- UsersService implements listUsers, createUser (with auth rollback on DB failure), updateUser (syncs app_metadata on role change), setUserStatus (syncs Supabase Auth ban_duration)
- GET /users, POST /users, PATCH /users/:id, PATCH /users/:id/status all protected by JwtAuthGuard and scoped to caller's companyId
- Backend builds cleanly with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: SQL migration — add manager_id to users, create employee_shifts table** - `657dd9b` (chore)
2. **Task 2: NestJS UsersModule — list, create, update role/manager, toggle status** - `cff666d` (feat)

## Files Created/Modified
- `backend/src/database/migrations/003_workforce_config.sql` - Adds manager_id to users, creates employee_shifts table with indexes
- `backend/src/database/rls/002_workforce_rls.sql` - RLS policy for employee_shifts tenant isolation
- `backend/src/users/dto/create-user.dto.ts` - CreateUserDto with fullName, email, password, role, optional managerId
- `backend/src/users/dto/update-user.dto.ts` - UpdateUserDto with optional role and managerId
- `backend/src/users/users.service.ts` - UsersService: listUsers, createUser, updateUser, setUserStatus
- `backend/src/users/users.controller.ts` - UsersController: 4 endpoints, all JwtAuthGuard-protected
- `backend/src/users/users.module.ts` - UsersModule (SupabaseModule is @Global, no import needed)
- `backend/src/app.module.ts` - Added UsersModule to imports array

## Decisions Made
- **ban_duration for disabled accounts:** Used `876000h` (~100 years) to effectively ban disabled users in Supabase Auth. This prevents new token issuance; existing tokens expire naturally via JWT TTL. Clean and reversible with `'none'`.
- **app_metadata sync on role change:** When role is updated, `auth.admin.updateUserById` is called to sync the role into app_metadata so future JWT tokens issued at login carry the new role claim without requiring re-registration.
- **SetStatusDto inline:** Defined as a local class in users.controller.ts rather than a separate file — single boolean field does not warrant a dedicated DTO file.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
Apply the new SQL migrations to Supabase before using the Users endpoints:
1. Run `backend/src/database/migrations/003_workforce_config.sql` in the Supabase SQL editor
2. Run `backend/src/database/rls/002_workforce_rls.sql` in the Supabase SQL editor

## Next Phase Readiness
- UsersModule is fully operational; admin can manage the employee roster via REST API
- employee_shifts table is in place, ready for Plan 04 (shift assignment)
- Ready to begin Phase 2 Plan 02 (Shifts management) or any subsequent phase

---
*Phase: 02-workforce-configuration*
*Completed: 2026-03-02*
