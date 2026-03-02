---
phase: 02-workforce-configuration
plan: "03"
subsystem: api, ui
tags: [nestjs, nextjs, tailwindcss, supabase, rest-api, shifts]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SupabaseService (global), JwtAuthGuard, auth token helpers
  - phase: 02-01
    provides: shifts table migration (002_shifts_table.sql), UsersModule pattern
provides:
  - NestJS ShiftsModule with GET /shifts, POST /shifts, PATCH /shifts/:id
  - ShiftsService exported for use in plan 04 (shift assignment)
  - Next.js /admin/shifts page with ShiftTable and ShiftFormModal
  - shifts.ts API helper with listShifts, createShift, updateShift
affects:
  - 02-04 (ShiftAssignment: will import ShiftsService from ShiftsModule)
  - 03-attendance-core (shift context for check-in/out)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PATCH endpoint with partial update (only defined fields applied to updateData)
    - ShiftsModule exports service for cross-module use (plan 04 dependency injection)
    - Dual-mode modal pattern (create vs edit based on prop presence)
    - Client-side access control gate by role before rendering admin UI

key-files:
  created:
    - backend/src/shifts/dto/create-shift.dto.ts
    - backend/src/shifts/dto/update-shift.dto.ts
    - backend/src/shifts/shifts.service.ts
    - backend/src/shifts/shifts.controller.ts
    - backend/src/shifts/shifts.module.ts
    - frontend/src/lib/api/shifts.ts
    - frontend/src/app/(app)/admin/shifts/page.tsx
    - frontend/src/app/(app)/admin/shifts/components/ShiftTable.tsx
    - frontend/src/app/(app)/admin/shifts/components/ShiftFormModal.tsx
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "ShiftsModule exports ShiftsService so plan 04 can inject it via DI without re-querying"
  - "PATCH uses sparse update (only defined fields) — consistent with UsersModule pattern"
  - "Frontend time inputs use type=time (browser-native HH:MM) — no custom picker needed"

patterns-established:
  - "Sparse PATCH: build updateData from only defined DTO fields before calling Supabase"
  - "Dual-mode modal: isEditMode = !!shift prop, same component for create and edit"
  - "catch (err: unknown) with instanceof Error check — TypeScript strict mode compliance"

requirements-completed: [SHFT-01, SHFT-02]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 2 Plan 03: Shift Management Summary

**NestJS ShiftsModule (GET/POST/PATCH endpoints with JwtAuthGuard, tenant-scoped) and Next.js /admin/shifts page with ShiftTable and dual-mode ShiftFormModal**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T02:32:47Z
- **Completed:** 2026-03-02T02:35:59Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- ShiftsModule with three REST endpoints (list, create, update) all guarded by JwtAuthGuard and scoped to caller's company_id
- ShiftsService exported from module so plan 04 can inject it for shift assignment validation
- Frontend /admin/shifts page with ShiftTable (columns: Name, Start Time, End Time, Grace Period, Actions) and role-gated access (owner/admin only)
- ShiftFormModal handles both create mode (empty form) and edit mode (pre-filled via shift prop) with error display

## Task Commits

Each task was committed atomically:

1. **Task 1: NestJS ShiftsModule** - `608faa5` (feat)
2. **Task 2: Frontend shifts management page** - `926d4a5` (feat)

## Files Created/Modified

- `backend/src/shifts/dto/create-shift.dto.ts` - Validated DTO with HH:MM regex and grace period 0-120
- `backend/src/shifts/dto/update-shift.dto.ts` - Same fields, all @IsOptional for partial updates
- `backend/src/shifts/shifts.service.ts` - listShifts, createShift, updateShift with tenant scoping
- `backend/src/shifts/shifts.controller.ts` - GET /shifts, POST /shifts, PATCH /shifts/:id behind JwtAuthGuard
- `backend/src/shifts/shifts.module.ts` - Exports ShiftsService for plan 04 DI
- `backend/src/app.module.ts` - Added ShiftsModule import
- `frontend/src/lib/api/shifts.ts` - Shift interface, CreateShiftData, listShifts, createShift, updateShift
- `frontend/src/app/(app)/admin/shifts/page.tsx` - Shift management page with state management and access control
- `frontend/src/app/(app)/admin/shifts/components/ShiftTable.tsx` - Table with empty state handling
- `frontend/src/app/(app)/admin/shifts/components/ShiftFormModal.tsx` - Create/edit modal with all four fields

## Decisions Made

- ShiftsModule explicitly exports ShiftsService so plan 04 (ShiftAssignment) can import ShiftsModule and inject ShiftsService without re-implementing queries
- PATCH endpoint uses sparse update pattern (only fields present in DTO applied) — same pattern as UsersModule PATCH
- Frontend time inputs use browser-native `type="time"` which natively produces HH:MM format — no custom parser needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- First `npm run build` in frontend hit a transient ENOENT on `.next/server/pages-manifest.json` (Next.js Turbopack parallel build race); second build succeeded cleanly — not a code issue
- TypeScript check via `npx tsc --noEmit` passed cleanly confirming no type errors

## User Setup Required

None - no external service configuration required. The shifts table was already created in migration 002_shifts_table.sql (Phase 1).

## Next Phase Readiness

- ShiftsModule and ShiftsService ready for plan 04 (ShiftAssignment) to import and validate against
- /admin/shifts page operational; admins can define shifts before assigning them to employees
- No blockers for plan 04

## Self-Check: PASSED

- All 9 created files confirmed on disk
- Both task commits (608faa5, 926d4a5) confirmed in git history

---
*Phase: 02-workforce-configuration*
*Completed: 2026-03-02*
