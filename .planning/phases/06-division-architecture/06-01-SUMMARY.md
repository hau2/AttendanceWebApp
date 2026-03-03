---
phase: 06-division-architecture
plan: "01"
subsystem: database
tags: [postgres, supabase, rls, migrations, divisions]

# Dependency graph
requires:
  - phase: 05-monitoring-reporting
    provides: Completed v1.0 milestone; existing users/companies/attendance schema in place
provides:
  - divisions table DDL (id, company_id, name, manager_id, timestamps, UNIQUE constraint)
  - users.division_id FK column (ON DELETE SET NULL) with index
  - RLS tenant isolation policy on divisions table
affects: [06-division-architecture, 07-employee-lifecycle, all phases using users or divisions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New table follows standard pattern: UUID PK, company_id FK NOT NULL, timestamps, IF NOT EXISTS guards for idempotency"
    - "UNIQUE(company_id, name) enforces intra-company uniqueness without application-layer checks"
    - "ON DELETE SET NULL for manager_id and division_id — preserves data integrity on user/division deletion"

key-files:
  created:
    - backend/src/database/migrations/007_divisions.sql
    - backend/src/database/rls/004_divisions_rls.sql
  modified: []

key-decisions:
  - "divisions.manager_id is nullable — a division can exist without an assigned manager"
  - "users.division_id uses ON DELETE SET NULL — deleting a division orphans employees to no division rather than cascading delete"
  - "UNIQUE(company_id, name) prevents duplicate division names within a company at the DB constraint level"
  - "RLS on divisions uses company_id = JWT app_metadata.company_id — consistent with all other tenant-isolated tables"

patterns-established:
  - "Migration 007 follows sequential numbering; next migration should be 008"
  - "RLS file 004 follows sequential numbering; next RLS file should be 005"

requirements-completed: [DIVN-01, DIVN-05]

# Metrics
duration: 1min
completed: 2026-03-03
---

# Phase 6 Plan 01: Division Architecture Summary

**PostgreSQL divisions table with tenant-isolated RLS, nullable manager_id FK, and users.division_id FK column — foundational schema for Phase 6 manager-scoping by division**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-03T07:00:35Z
- **Completed:** 2026-03-03T07:01:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `divisions` table with UUID PK, company_id FK (CASCADE), nullable manager_id FK (SET NULL), name, timestamps, and UNIQUE(company_id, name) constraint
- Added `division_id` UUID FK column to `users` table (ON DELETE SET NULL) with supporting index
- Created RLS policy `divisions_tenant_isolation` that enforces company_id scoping via JWT app_metadata claim — consistent with all existing tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create divisions table migration** - `0329548` (feat)
2. **Task 2: Create divisions RLS policy** - `63e69c0` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/database/migrations/007_divisions.sql` - Creates divisions table and adds division_id column to users; fully idempotent with IF NOT EXISTS guards
- `backend/src/database/rls/004_divisions_rls.sql` - Enables RLS on divisions and creates tenant isolation policy; notes that users.division_id does not need separate RLS (covered by existing users RLS)

## Decisions Made

- `divisions.manager_id` is nullable (ON DELETE SET NULL) — a division can exist without an assigned manager; avoids forcing assignment before a manager is set up
- `users.division_id` is nullable (ON DELETE SET NULL) — employees are not deleted when their division is deleted; they simply become division-less
- `UNIQUE(company_id, name)` enforced at DB constraint level — prevents duplicate division names within a company without relying on application logic
- RLS policy uses the same `auth.jwt() -> 'app_metadata' ->> 'company_id'` pattern as all other tables — no new auth pattern introduced

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Run these SQL files in the Supabase SQL editor before testing any Phase 6 endpoints:**

1. `backend/src/database/migrations/007_divisions.sql` (creates divisions table + users.division_id)
2. `backend/src/database/rls/004_divisions_rls.sql` (enables RLS + tenant isolation policy on divisions)

Run in the order listed — RLS file requires the table to exist first.

## Next Phase Readiness

- Schema foundation complete — all Phase 6 plans (06-02 through 06-06) can proceed
- `divisions` table ready for DivisionService CRUD operations (06-02)
- `users.division_id` column ready for assignment logic (06-03)
- RLS in place for any client-side Supabase queries against divisions

## Self-Check: PASSED

- backend/src/database/migrations/007_divisions.sql: FOUND
- backend/src/database/rls/004_divisions_rls.sql: FOUND
- .planning/phases/06-division-architecture/06-01-SUMMARY.md: FOUND
- Commit 0329548 (Task 1): FOUND
- Commit 63e69c0 (Task 2): FOUND

---
*Phase: 06-division-architecture*
*Completed: 2026-03-03*
