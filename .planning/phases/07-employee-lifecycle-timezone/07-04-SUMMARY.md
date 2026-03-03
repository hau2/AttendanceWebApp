---
phase: 07-employee-lifecycle-timezone
plan: 04
subsystem: ui
tags: [react, nextjs, tailwind, users, employee-lifecycle, divisions, timezone]

# Dependency graph
requires:
  - phase: 07-02
    provides: DELETE /users/:id soft-delete, PATCH /users/:id with fullName+timezone, manager-scoped POST /users, GET /users with nested division+manager join

provides:
  - Delete employee button (admin/owner only) with window.confirm, calls DELETE /users/:id
  - EditUserModal with fullName, division, and timezone fields — calls PATCH /users/:id
  - Manager column in UserTable showing division.manager name via nested join
  - CreateUserModal filtered divisions for Manager role (only managed divisions shown)
  - Manager role access to /admin/users page (was admin/owner only)
affects: [08-remote-acknowledgment, 09-filters-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Manager-scoped division filtering: compute availableDivisions = divisions.filter(d => d.manager_id === currentUserId) before rendering
    - Nested division join: user.divisions?.users?.full_name resolves manager name in single backend query
    - currentUserRole prop on table component controls read vs edit mode inline

key-files:
  created:
    - frontend/src/app/(app)/admin/users/components/EditUserModal.tsx
  modified:
    - frontend/src/lib/api/users.ts
    - frontend/src/app/(app)/admin/users/components/UserTable.tsx
    - frontend/src/app/(app)/admin/users/components/CreateUserModal.tsx
    - frontend/src/app/(app)/admin/users/page.tsx

key-decisions:
  - "Manager column resolves via user.divisions?.users?.full_name (nested FK join from backend, no extra round-trip)"
  - "Delete button hidden for owner-role users at UI level (matches backend BadRequestException guard)"
  - "Manager role sees static role span instead of role select in UserTable — manager cannot change roles"
  - "Manager role sees only their own divisions in CreateUserModal division dropdown (filtered by manager_id === currentUserId)"
  - "Import CSV button hidden for Manager role — managers can only create employees one at a time"
  - "window.confirm used for delete confirmation (consistent with existing plain Tailwind modal pattern; no Shadcn Dialog added)"

patterns-established:
  - "currentUserRole prop pattern: pass role down to table/modal components for conditional rendering rather than checking in parent"
  - "availableDivisions computed before render guard: filter in component scope before passing to JSX"

requirements-completed: [EMPL-01, EMPL-02, EMPL-03, EMPL-04]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 7 Plan 04: Employee Lifecycle Frontend Summary

**Delete/Edit/Manager-column frontend for EMPL-01–04: soft-delete with confirm, EditUserModal (name+division+timezone), Manager column via division join, manager-scoped Create**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T13:59:57Z
- **Completed:** 2026-03-03T14:03:57Z
- **Tasks:** 2
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments
- Delete employee flow: Admin/owner sees Delete button per row; `window.confirm` guard; calls `deleteUser()` → refreshes list; owner-role rows never show Delete
- EditUserModal: pre-populated from user data; admin saves fullName, division, and personal timezone in a single PATCH call
- Manager column added to UserTable sourced from `user.divisions?.users?.full_name` — no extra API call required
- CreateUserModal now accepts manager role: filters division dropdown to manager's own divisions, locks role field to Employee

## Task Commits

Each task was committed atomically:

1. **Task 1: Update API helper and User type; add EditUserModal** - `67eec4e` (feat)
2. **Task 2: Update UserTable, CreateUserModal, page.tsx** - `54944a5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/lib/api/users.ts` — Added `timezone`, `divisions` nested type to `User`; expanded `UpdateUserData` with `fullName` and `timezone`; added `deleteUser()` function
- `frontend/src/app/(app)/admin/users/components/EditUserModal.tsx` — New modal: fullName/division/timezone fields; pre-populates from user; calls `updateUser()` on save
- `frontend/src/app/(app)/admin/users/components/UserTable.tsx` — Added `currentUserRole`, `onEdit`, `onDelete` props; Manager column via `divisions?.users?.full_name`; conditional role display; Edit/Delete buttons for admin/owner
- `frontend/src/app/(app)/admin/users/components/CreateUserModal.tsx` — Added `currentUserId`/`currentUserRole` props; `availableDivisions` filter for manager scope; read-only role display for manager users
- `frontend/src/app/(app)/admin/users/page.tsx` — Allow manager role; `handleDelete` with confirm; `editingUser` state; wire `EditUserModal`; conditional CSV import button

## Decisions Made
- Manager column resolves via `user.divisions?.users?.full_name` (nested FK join from backend, no extra round-trip)
- Delete button hidden for owner-role users at UI level, matching backend `BadRequestException` guard
- `window.confirm` used for delete confirmation — consistent with existing plain Tailwind pattern; no Shadcn Dialog added
- Manager role sees static text for Role column, no dropdowns for manager/division assignments — read-only table view

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- EMPL-01 through EMPL-04 fully delivered (backend 07-02 + frontend 07-04)
- Phase 7 is complete — all employee lifecycle and per-user timezone requirements done
- Ready for Phase 8: Remote work flag + acknowledgment workflow

---
*Phase: 07-employee-lifecycle-timezone*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: EditUserModal.tsx
- FOUND: users.ts (with timezone, divisions, deleteUser, UpdateUserData.fullName)
- FOUND: UserTable.tsx (with Manager column, onEdit, onDelete, currentUserRole)
- FOUND: CreateUserModal.tsx (with currentUserId, currentUserRole, availableDivisions)
- FOUND: page.tsx (with manager role access, handleDelete, editingUser, EditUserModal)
- FOUND: 07-04-SUMMARY.md
- FOUND commit: 67eec4e (Task 1)
- FOUND commit: 54944a5 (Task 2)
