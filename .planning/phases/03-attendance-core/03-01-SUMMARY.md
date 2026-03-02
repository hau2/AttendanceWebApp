---
phase: 03-attendance-core
plan: "01"
subsystem: api
tags: [nestjs, supabase, attendance, rls, typescript, postgresql]

# Dependency graph
requires:
  - phase: 02-workforce-configuration
    provides: ShiftAssignmentsService.getActiveShift for on-time/late classification; ShiftsModule exported for DI

provides:
  - attendance_records SQL table with full schema and indexes
  - RLS policy scoping attendance_records to company_id JWT claim
  - POST /attendance/check-in — timezone-aware, IP-enforced, idempotent check-in with shift classification
  - POST /attendance/check-out — validates existing check-in, classifies early/on-time, requires note when early
  - GET /attendance/history — user's records for given month
  - GET /attendance/records — admin/manager company-wide attendance list with user join
  - AttendanceService, AttendanceController, AttendanceModule

affects:
  - 03-02-photo-upload
  - 03-03-attendance-ui
  - 04-admin-adjustments
  - 05-monitoring-reporting

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Timezone-aware work date using toLocaleDateString('en-CA', { timeZone }) produces YYYY-MM-DD natively
    - Minute-based shift classification using toLocaleTimeString for timezone conversion
    - IP allowlist enforcement — empty allowlist = no restriction; enforce-block mode throws ForbiddenException
    - Company settings fetched in one query (timezone + ip_mode + ip_allowlist) at start of each operation
    - Date range filter via gte/lt on month boundaries instead of date_trunc for cross-platform compatibility

key-files:
  created:
    - backend/src/database/migrations/004_attendance_records.sql
    - backend/src/database/rls/003_attendance_rls.sql
    - backend/src/attendance/dto/check-in.dto.ts
    - backend/src/attendance/dto/check-out.dto.ts
    - backend/src/attendance/attendance.service.ts
    - backend/src/attendance/attendance.controller.ts
  modified:
    - backend/src/attendance/attendance.module.ts

key-decisions:
  - "Empty IP allowlist treated as no restriction (withinAllowlist=true, blocked=false) — companies without IP policy should not block anyone"
  - "getWorkDate uses toLocaleDateString('en-CA', { timeZone }) — produces YYYY-MM-DD natively without date libraries"
  - "Minute-based shift classification using toLocaleTimeString with timezone — avoids manual UTC offset math"
  - "Company settings fetched once per request (not cached) — avoids stale IP policy after admin updates"
  - "Date range filter uses gte startDate + lt nextMonthStart — avoids date_trunc for Supabase compatibility"
  - "listRecords joins users table for full_name — admin view shows employee names without second query"
  - "PhotoUploadController preserved in AttendanceModule — photo upload skeleton from prior phase not disrupted"

patterns-established:
  - "IP enforcement pattern: fetch company allowlist, empty = pass, check membership, mode determines block vs log"
  - "Idempotency guard pattern: check for existing record before insert, ConflictException on duplicate"
  - "Work date isolation: always compute work_date from company timezone at request time, not UTC date"

requirements-completed:
  - ATTN-02
  - ATTN-03
  - ATTN-04
  - ATTN-05
  - ATTN-06
  - ATTN-07
  - ATTN-09
  - ATTN-11
  - ATTN-12
  - ATTN-13

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 3 Plan 01: Attendance Core Backend Summary

**NestJS AttendanceModule with timezone-aware check-in/out classification, IP enforcement, idempotency guards, and full attendance_records schema**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T03:35:05Z
- **Completed:** 2026-03-02T03:43:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created `attendance_records` table with UNIQUE(user_id, work_date), all status CHECK constraints, both photo_url columns nullable, source column, and 4 performance indexes
- Implemented check-in endpoint with timezone-aware work date, minute-based shift classification (on-time/within-grace/late), IP allowlist enforcement (enforce-block throws 403, log-only records withinAllowlist flag), idempotency (409 on duplicate), and late_reason requirement when status='late'
- Implemented check-out endpoint validating existing check-in (404 if missing), preventing duplicate (409), classifying early/on-time, requiring early_note when early
- Added admin/manager GET /attendance/records with user full_name join and role gate

## Task Commits

Each task was committed atomically:

1. **Task 1: attendance_records SQL migration and RLS policy** - `679a729` (feat)
2. **Task 2: NestJS AttendanceModule** - `78db59a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/database/migrations/004_attendance_records.sql` - attendance_records table schema with all check-in/out fields, constraints, and indexes
- `backend/src/database/rls/003_attendance_rls.sql` - RLS policy scoping to JWT app_metadata.company_id
- `backend/src/attendance/dto/check-in.dto.ts` - CheckInDto with optional photo_url and late_reason (max 500 chars)
- `backend/src/attendance/dto/check-out.dto.ts` - CheckOutDto with optional photo_url and early_note (max 500 chars)
- `backend/src/attendance/attendance.service.ts` - Core business logic: IP check, work date, classification, CRUD
- `backend/src/attendance/attendance.controller.ts` - POST check-in, POST check-out, GET history, GET records (admin/manager)
- `backend/src/attendance/attendance.module.ts` - Updated to import ShiftsModule and register AttendanceService + both controllers

## Decisions Made

- Empty IP allowlist treated as no restriction (withinAllowlist=true, blocked=false) — companies without IP policy must not block employees
- `getWorkDate` uses `toLocaleDateString('en-CA', { timeZone })` — produces YYYY-MM-DD without date libraries
- Minute-based classification using `toLocaleTimeString` for timezone conversion — avoids manual UTC offset math
- Company settings fetched once per request — avoids stale IP policy after admin updates
- Date range filter uses `gte startDate + lt nextMonthStart` instead of `date_trunc` — Supabase/PostgREST compatibility
- PhotoUploadController preserved from prior phase skeleton in AttendanceModule

## Deviations from Plan

None - plan executed exactly as written. PhotoUploadController already existed in the attendance directory from a prior plan; it was retained and registered in the updated module.

## Issues Encountered

None.

## User Setup Required

Run migration files in Supabase SQL editor before testing check-in/out:

1. `backend/src/database/migrations/004_attendance_records.sql` — creates attendance_records table
2. `backend/src/database/rls/003_attendance_rls.sql` — enables RLS and creates tenant isolation policy

## Next Phase Readiness

- Backend API fully operational for check-in/out — photo upload UI (03-02) and employee UI (03-03) can build on these endpoints
- GET /attendance/records provides data for admin adjustment (Phase 4) and monitoring (Phase 5)
- AttendanceService exported from AttendanceModule for use by future phases

## Self-Check: PASSED

All created files verified present. Both task commits confirmed in git log.

- FOUND: backend/src/database/migrations/004_attendance_records.sql
- FOUND: backend/src/database/rls/003_attendance_rls.sql
- FOUND: backend/src/attendance/attendance.service.ts
- FOUND: backend/src/attendance/attendance.controller.ts
- FOUND: backend/src/attendance/attendance.module.ts
- FOUND: backend/src/attendance/dto/check-in.dto.ts
- FOUND: backend/src/attendance/dto/check-out.dto.ts
- FOUND: .planning/phases/03-attendance-core/03-01-SUMMARY.md
- FOUND commit: 679a729 (Task 1)
- FOUND commit: 78db59a (Task 2)
- Build: PASSED (npm run build exits 0, zero TypeScript errors)

---
*Phase: 03-attendance-core*
*Completed: 2026-03-02*
