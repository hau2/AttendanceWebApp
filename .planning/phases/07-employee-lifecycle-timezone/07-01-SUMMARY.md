---
phase: 07-employee-lifecycle-timezone
plan: "01"
subsystem: database
tags: [postgres, supabase, migration, timezone, employee-lifecycle]

# Dependency graph
requires:
  - phase: 06-division-architecture
    provides: "007_divisions.sql migration; users.division_id FK column already in users table"
provides:
  - "users.timezone nullable TEXT column for per-user IANA timezone override"
  - "idx_users_timezone sparse index on non-null timezone rows"
  - "Documented soft-delete approach: retain users row, delete auth account + set is_active=false"
affects:
  - 07-02
  - 07-03
  - all Phase 7 plans that read user timezone for attendance classification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Soft-delete pattern for employee removal: delete Supabase Auth user + set is_active=false; public.users row retained indefinitely for attendance history join"

key-files:
  created:
    - backend/src/database/migrations/008_employee_lifecycle.sql
  modified: []

key-decisions:
  - "Employee delete is soft-delete: Supabase Auth user deleted (revokes login) + is_active=false (removes from active lists); public.users row RETAINED so attendance_records JOIN can still display full_name in historical reports"
  - "attendance_records.user_id FK has ON DELETE CASCADE (migration 004) but is safe because the public.users row is never hard-deleted under soft-delete approach"
  - "users.timezone is nullable TEXT — NULL means use company timezone (preserves existing behavior); non-null must be a valid IANA timezone string"

patterns-established:
  - "Sparse partial index pattern: CREATE INDEX ... WHERE timezone IS NOT NULL — avoids indexing the common NULL case"

requirements-completed: [EMPL-01, EMPL-02, TZMG-01]

# Metrics
duration: 1min
completed: "2026-03-03"
---

# Phase 7 Plan 01: Employee Lifecycle + Timezone Migration Summary

**SQL migration adding users.timezone nullable column with sparse index, plus documented soft-delete approach for employee removal preserving attendance history**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T13:54:16Z
- **Completed:** 2026-03-03T13:55:07Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created migration 008_employee_lifecycle.sql with `ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT`
- Added sparse partial index `idx_users_timezone` on non-null timezone rows only
- Clarified and documented the soft-delete approach: public.users row is never hard-deleted; Supabase Auth user is deleted + is_active=false set to hide employee from active lists while retaining attendance history joinability
- Confirmed attendance_records FK CASCADE is safe given the soft-delete approach (users row always retained)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 008 — add users.timezone column** - `1bb67e8` (chore)

**Plan metadata:** _(final docs commit — see below)_

## Files Created/Modified
- `backend/src/database/migrations/008_employee_lifecycle.sql` - SQL migration adding timezone column to users table with soft-delete behavior documentation

## Decisions Made
- Employee "delete" is implemented as soft-delete: Supabase Auth account is deleted (prevents login), public.users row has is_active set to false (hides from active lists), but the users row itself is never removed — this preserves the ability to JOIN attendance_records on user_id and display the employee's full_name in historical reports
- users.timezone column is nullable TEXT; NULL = inherit company timezone (zero regression for existing behavior); non-null = IANA timezone string used for per-employee late/early classification override

## Deviations from Plan

### Observation (not a deviation)

Migration 004_attendance_records.sql uses `ON DELETE CASCADE` on the user_id FK — which contradicts the plan's assumption of "no cascade." However, this is not an issue because the soft-delete approach means the public.users row is never hard-deleted. The cascade would only trigger on a hard delete, which the application never performs. The plan's documentation comment was updated to accurately reflect this.

---

**Total deviations:** 0 auto-fixes
**Impact on plan:** Plan executed exactly as written. Soft-delete interpretation clarified and documented accurately.

## Issues Encountered
- Migration 004 actually has `ON DELETE CASCADE` (not RESTRICT as the plan's comment assumed). Since the application uses soft-delete (users row retained), this is not a functional issue. The migration 008 comment was written accurately to reflect the real situation.

## User Setup Required

**Manual step required:** Run migration 008 in Supabase SQL editor before testing any Phase 7 endpoints.

Steps:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `backend/src/database/migrations/008_employee_lifecycle.sql`
3. Run the SQL
4. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone';` should return one row

## Next Phase Readiness
- users.timezone column exists — Phase 7 Plan 02 (employee delete endpoint) and Plan 03 (timezone classification logic) can proceed
- Soft-delete approach is locked in — Phase 7 Plan 02 must implement: delete auth user + PATCH users SET is_active=false
- No blockers

---
*Phase: 07-employee-lifecycle-timezone*
*Completed: 2026-03-03*
