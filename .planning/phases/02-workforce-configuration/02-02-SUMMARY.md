---
phase: 02-workforce-configuration
plan: "02"
subsystem: ui
tags: [nextjs, react, tailwind, user-management, csv-import]

# Dependency graph
requires:
  - phase: 02-01
    provides: UsersModule backend with GET/POST/PATCH /users endpoints
  - phase: 01-foundation
    provides: auth helpers (getStoredToken, getStoredUser, AuthUser interface)
provides:
  - Admin /admin/users page with full user roster management UI
  - UserTable with inline role selector, status toggle, and manager assignment
  - CreateUserModal with 5-field form and manager dropdown
  - CsvImportModal with client-side FileReader CSV parsing and bulk import
  - frontend/src/lib/api/users.ts with all 5 user API helper functions
affects:
  - 02-03-shifts (admin UI pattern established)
  - 03-attendance-core (user roles/manager assignment in place)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side CSV parsing using FileReader + String.split (no library)
    - Sequential POST-per-row for bulk import (avoids rate limiting)
    - Modal-as-overlay using plain Tailwind (fixed inset-0 backdrop + centered card)
    - Role-based access guard at top of page component (redirect-free denial message)

key-files:
  created:
    - frontend/src/lib/api/users.ts
    - frontend/src/app/(app)/admin/users/page.tsx
    - frontend/src/app/(app)/admin/users/components/UserTable.tsx
    - frontend/src/app/(app)/admin/users/components/CreateUserModal.tsx
    - frontend/src/app/(app)/admin/users/components/CsvImportModal.tsx
  modified: []

key-decisions:
  - "Modal overlay implemented with plain Tailwind (fixed inset-0 + centered card) — avoids Shadcn Dialog import complexity"
  - "CSV import sends sequential POST /users calls (not Promise.all) — prevents rate limit issues on large imports"
  - "CSV parsing uses FileReader + split on newline/comma — no library needed for v1 single-tenant CSV files"
  - "Owner role excluded from role selector dropdown — prevents accidental demotion of company owner"
  - "Manager dropdown in UserTable uses all users with role=manager — consistent with CreateUserModal behavior"

patterns-established:
  - "Admin UI pages under (app)/admin/* follow: access check → refreshUsers on mount → handlers call API then refresh"
  - "CSV column header index lookup approach — flexible to column order in user-provided files"

requirements-completed: [USER-01, USER-02, USER-03, USER-04, USER-05, USER-06]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 2 Plan 02: User Management Frontend Summary

**Admin /admin/users page with UserTable, CreateUserModal, CsvImportModal, and users.ts API helper covering list/create/update/status/bulk-import**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T02:32:20Z
- **Completed:** 2026-03-02T02:40:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Full admin user roster at /admin/users: paginated table with inline role selector, active/disabled badge + toggle, and manager assignment dropdown
- CreateUserModal: 5-field form (name, email, password, role, manager) with manager field conditional on employee role
- CsvImportModal: client-side FileReader CSV parsing, header-index-based column detection, sequential POST /users per row, result summary with per-row error messages
- users.ts API helper: listUsers, createUser, updateUser, setUserStatus, importUsersCSV — all with Bearer token auth and typed Error throws

## Task Commits

Each task was committed atomically:

1. **Task 1: API helper and User Management page with table** - `0f88835` (feat)
2. **Task 2: Create User modal and CSV import modal** - `7a33dc2` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `frontend/src/lib/api/users.ts` - All 5 user API helper functions (listUsers, createUser, updateUser, setUserStatus, importUsersCSV)
- `frontend/src/app/(app)/admin/users/page.tsx` - Admin user management page with access control and modal wiring
- `frontend/src/app/(app)/admin/users/components/UserTable.tsx` - Table with role select, status badge/toggle, and manager assign dropdown
- `frontend/src/app/(app)/admin/users/components/CreateUserModal.tsx` - Modal form: name/email/password/role/manager fields
- `frontend/src/app/(app)/admin/users/components/CsvImportModal.tsx` - File input, CSV parse, preview, import, and result display

## Decisions Made
- Plain Tailwind modal overlay (not Shadcn Dialog) — avoids potential import issues per plan instructions
- Sequential CSV import (not Promise.all) — rate-limit safe; errors attributed per email in result summary
- Owner role excluded from role change dropdown — prevents accidental demotion
- CSV parser uses header-index lookup — flexible to user-provided column order, not positional assumption

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Stale `.next/lock` file from prior build blocked second build run — removed with `rm -f` before rebuilding. No code change needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- User management UI complete; admins can create, update, disable, and bulk-import users
- Manager assignment ready; shift assignment UI (02-03) can use managers already in the system
- /admin/users accessible after login with owner or admin role

---
*Phase: 02-workforce-configuration*
*Completed: 2026-03-02*
