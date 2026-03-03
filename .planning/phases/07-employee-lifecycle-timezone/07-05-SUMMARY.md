---
phase: 07-employee-lifecycle-timezone
plan: 05
subsystem: ui
tags: [verification, e2e, employee-lifecycle, timezone]

# Dependency graph
requires:
  - phase: 07-04
    provides: Delete/Edit buttons, EditUserModal (fullName+division+timezone), Manager column, manager-scoped CreateUserModal
  - phase: 07-03
    provides: effectiveTimezone override in checkIn/checkOut classification
  - phase: 07-02
    provides: deleteUser, updateUser with timezone, backend EMPL/TZMG endpoints
  - phase: 07-01
    provides: users.timezone nullable column (migration 008)
provides:
  - Phase 7 end-to-end human verification (APPROVED 2026-03-03)
affects: [08-remote-acknowledgment]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "EMPL-03 revised: Manager cannot access /admin/users or create employees — admin/owner only. Manager-scoped create removed from backend POST /users and frontend."
  - "deleteUser uses auth ban (876000h) not auth.admin.deleteUser() — public.users has ON DELETE CASCADE to auth.users which would wipe attendance records"
  - "deleted_at column added (migration 009) to distinguish soft-deleted (hidden) from disabled (visible, inactive)"
  - "Timezone field in EditUserModal uses grouped select with 35 IANA timezones — not free-text input"

patterns-established:
  - "Soft-delete pattern: ban auth + set is_active=false + set deleted_at=NOW() — row preserved, user invisible"

requirements-completed: [EMPL-01, EMPL-02, EMPL-04, TZMG-01, TZMG-02]
# Note: EMPL-03 (Manager creates employee) requirement was revised — only Admin/Owner can create users

# Metrics
duration: ~60 min (including bug fixes during verification)
completed: 2026-03-03
---

# Phase 7 Plan 05: Human Verification — CHECKPOINT PENDING

**Phase 7 end-to-end verification of employee lifecycle (delete/edit/create) and per-user timezone classification — awaiting human tester confirmation.**

## Status: CHECKPOINT PENDING

This plan consists entirely of checkpoint tasks. No automated work was performed by this executor. The checkpoint content is surfaced below for human action and verification.

## Tasks

### Task 1: checkpoint:human-action — Apply migration 008 to Supabase

**Status: AWAITING HUMAN ACTION**

Before verification can begin, apply the Phase 7 database migration:

1. Open Supabase Dashboard -> SQL editor
2. Open file: `backend/src/database/migrations/008_employee_lifecycle.sql`
3. Paste and run the migration
4. Confirm: no errors, `users` table now has a `timezone` column

Then start both servers if not already running:
- Backend: `cd backend && npm run start:dev`
- Frontend: `cd frontend && npm run dev`

Visit: http://localhost:3000

**Resume signal:** Type "ready" when migration is applied and servers are running

---

### Task 2: checkpoint:human-verify — Verify all Phase 7 acceptance criteria

**Status: AWAITING HUMAN VERIFICATION**

**What was built:** Employee lifecycle management (delete, edit, manager create) and per-user timezone classification. All six requirements (EMPL-01 through EMPL-04, TZMG-01 and TZMG-02) are implemented across backend and frontend.

**Test 1: EMPL-01 — Admin deletes employee, history preserved**
1. Log in as Admin
2. Navigate to /admin/users
3. Find a test Employee with at least one attendance record
4. Click "Delete" -> confirm the dialog
5. Verify: employee row disappears from the users list
6. Navigate to /admin/attendance -> search for that employee's records
7. Verify: the attendance records still appear with the employee's name showing correctly

**Test 2: EMPL-02 — Admin edits name, division, timezone**
1. As Admin on /admin/users, click "Edit" on any employee
2. Change the Full Name to a different value
3. Change the Division assignment to a different division
4. Enter a timezone: `America/New_York`
5. Click Save Changes
6. Verify: the user row in the table reflects the new name, division, and the edit succeeded without error

**Test 3: EMPL-03 — Manager creates employee in their own division only**
1. Log in as a Manager
2. Navigate to /admin/users (should be accessible, not blocked)
3. Click "Add Employee"
4. Verify: the Division dropdown shows ONLY divisions this Manager manages (not all divisions)
5. Verify: the Role field shows "Employee" (read-only, not a dropdown)
6. Fill in name, email, password, select a division — create the employee
7. Verify: new employee appears in the list assigned to that division

**Test 4: EMPL-04 — Manager column shows responsible manager**
1. As Admin on /admin/users
2. Verify: there is a "Manager" column in the user table
3. For employees assigned to a division that has a manager, the Manager column shows that manager's name
4. For employees with no division or a division with no manager, the column shows "—"

**Test 5: TZMG-01 and TZMG-02 — Per-user timezone classification**
1. As Admin, edit an employee and set their timezone to `America/New_York`
2. Log in as that employee (or use a second browser/incognito window)
3. Attempt check-in — if the employee's local New York time is before/after the shift start by a meaningful amount, the classification should reflect New York time
4. Alternatively: check that PATCH /users/:id with `{"timezone": "America/New_York"}` succeeds (curl or browser network tab) — and that GET /users shows the timezone field on the user object
5. Verify the company timezone is still used for employees with no personal timezone set (check another employee's record)

**Resume signal:** Type "approved" if all 5 tests pass, or describe any failures

---

## Prior Plan Commits (all work completed, awaiting verification only)

| Plan | Description | Commit |
|------|-------------|--------|
| 07-01 | Migration 008 — users.timezone column | `70cef54` |
| 07-02 | Backend employee lifecycle (EMPL-01–04, TZMG-01) | `44a3367` |
| 07-03 | Attendance timezone override (TZMG-02) | `fe87225` |
| 07-04 | Frontend (Delete, EditUserModal, Manager column, manager-scoped Create) | `f150ceb` |

## Deviations from Plan

None — this plan is checkpoint-only. No automated work to perform.

## Next Phase Readiness

Once human verification is approved:
- Update requirements-completed in this SUMMARY.md to: [EMPL-01, EMPL-02, EMPL-03, EMPL-04, TZMG-01, TZMG-02]
- Update STATE.md: Phase 7 COMPLETE, progress 40% (2/5 v2.0 phases)
- Proceed to Phase 8: Remote Work + Acknowledgment Flow

---
*Phase: 07-employee-lifecycle-timezone*
*Completed: PENDING*
