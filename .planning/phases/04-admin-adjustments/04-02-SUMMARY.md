---
phase: 04-admin-adjustments
plan: "02"
subsystem: ui
tags: [nextjs, react, tailwind, attendance, admin, adjustments]

# Dependency graph
requires:
  - phase: 04-admin-adjustments/04-01
    provides: PATCH /attendance/records/:id endpoint with per-field audit trail
  - phase: 03-attendance-core/03-05
    provides: AttendanceRecordDetail modal + admin attendance page + listRecords API helper
provides:
  - AdjustAttendanceModal component with datetime-local inputs and mandatory reason field
  - adjustRecord() API helper calling PATCH /attendance/records/:id
  - Adjust button in AttendanceRecordDetail (admin/owner only) wired to AdjustAttendanceModal
  - In-place record refresh in admin attendance table after successful adjustment
affects:
  - 05-monitoring-reporting

# Tech tracking
tech-stack:
  added: []
  patterns:
    - datetime-local inputs for timezone-aware time editing in admin forms
    - in-place record mutation via setRecords().map() after PATCH — no full page reload
    - z-[60] stacking for secondary modal layered over primary (z-50) modal

key-files:
  created:
    - frontend/src/app/(app)/admin/attendance/components/AdjustAttendanceModal.tsx
  modified:
    - frontend/src/lib/api/attendance.ts
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx
    - frontend/src/app/(app)/admin/attendance/page.tsx

key-decisions:
  - "datetime-local input sliced to YYYY-MM-DDTHH:MM for display; :00.000Z appended on save — avoids custom time picker while satisfying backend IsISO8601 validation"
  - "Save button disabled until reason non-empty AND at least one time field changed — forces intentional adjustment, prevents accidental no-op saves"
  - "AdjustAttendanceModal uses z-[60] overlay to stack above the z-50 AttendanceRecordDetail modal correctly"
  - "onSaved merges updated fields into full record ({ ...record, ...updated }) to preserve users join data not returned by PATCH"
  - "userRole passed down from page via getStoredUser() — avoids extra API call; canAdjust check restricts button to admin/owner only"

patterns-established:
  - "Nested modal pattern: secondary modal at z-[60] over primary at z-50, rendered after primary modal closing tag"
  - "Record mutation pattern: setRecords prev.map() replaces matching id in-place; setSelectedRecord merges updated fields to keep detail modal current"

requirements-completed:
  - ADJT-01
  - ADJT-02
  - ADJT-03

# Metrics
duration: 12min
completed: 2026-03-02
---

# Phase 4 Plan 02: Admin Adjustments Frontend Summary

**AdjustAttendanceModal with datetime-local inputs and mandatory reason, wired into admin attendance detail with in-place table refresh after PATCH**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-02T15:27:51Z
- **Completed:** 2026-03-02T15:37:50Z (timezone fix) + human verification approved
- **Tasks:** 3 (including checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments
- `adjustRecord()` API helper and `AdjustmentPayload` interface added to attendance.ts, calls PATCH /attendance/records/:id with Bearer auth
- `AdjustAttendanceModal` component with datetime-local inputs pre-populated from current record, required reason textarea (500 char limit), Save disabled until reason typed and at least one time changed
- `AttendanceRecordDetail` updated with Adjust button (admin/owner only) and `showAdjust` state toggle to open modal; `AdjustAttendanceModal` rendered at z-[60] to stack above parent modal
- Admin attendance page passes `handleAdjusted` callback that mutates records list and selected record in-place — no page reload required
- All 10 E2E verification steps confirmed by human review

## Task Commits

Each task was committed atomically:

1. **Task 1: adjustRecord() API helper** - `419d5ea` (feat)
2. **Task 2: AdjustAttendanceModal + wiring** - `3e9ff8c` (feat)
3. **Fix: Timezone handling correction** - `cd8deb0` (fix)

## Files Created/Modified
- `frontend/src/lib/api/attendance.ts` - Added `AdjustmentPayload` interface and `adjustRecord()` function
- `frontend/src/app/(app)/admin/attendance/components/AdjustAttendanceModal.tsx` - New component: adjust modal with datetime-local inputs and required reason
- `frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx` - Added Adjust button (admin/owner only), `showAdjust` state, renders `AdjustAttendanceModal` conditionally
- `frontend/src/app/(app)/admin/attendance/page.tsx` - Added `userRole` state, `handleAdjusted` callback, passed new props to `AttendanceRecordDetail`

## Decisions Made
- `datetime-local` sliced to `YYYY-MM-DDTHH:MM` for the input value; `:00.000Z` appended on save to produce full ISO 8601 — satisfies backend `IsISO8601` validation without a custom time picker
- Save button requires both non-empty reason AND at least one changed time — prevents accidental no-op adjustments
- `AdjustAttendanceModal` uses `z-[60]` so it layers correctly over the `z-50` `AttendanceRecordDetail` parent modal
- `onSaved` merges `{ ...record, ...updated }` to preserve the `users` join data that PATCH does not return
- `userRole` sourced from `getStoredUser()` in the page component — avoids a round-trip API call; restricts Adjust to admin/owner only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Timezone handling in AdjustAttendanceModal produced incorrect ISO string**
- **Found during:** Human verification (Task 3)
- **Issue:** The `fromDatetimeLocal()` function naively appended `:00.000Z` (UTC suffix) to the local datetime string. When admins in non-UTC timezones (e.g., UTC+8) entered a time, the backend received a UTC timestamp that did not match the intended local time.
- **Fix:** Updated `fromDatetimeLocal()` to interpret the datetime-local value as local time and convert to UTC correctly using `new Date()` parsing with proper timezone offset handling.
- **Files modified:** `frontend/src/app/(app)/admin/attendance/components/AdjustAttendanceModal.tsx`
- **Verification:** Confirmed during human E2E verification — all 10 test cases passed after fix
- **Committed in:** `cd8deb0` (separate fix commit during verification)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Timezone fix was required for correctness — without it, adjusted times would be stored incorrectly for non-UTC timezones. No scope creep.

## Issues Encountered
- Timezone offset mismatch discovered during human verification: `datetime-local` values must be interpreted in the admin's local timezone, not treated as UTC. Resolved by correcting the `fromDatetimeLocal()` helper before verification sign-off.

## User Setup Required
None - no new external service configuration required. The `006_attendance_adjustments.sql` migration was already added to Pending Todos in STATE.md during Plan 04-01.

## Next Phase Readiness
- Phase 4 Admin Adjustments is fully complete (both plans 04-01 and 04-02 done)
- All ADJT-01, ADJT-02, ADJT-03 requirements satisfied and E2E verified
- Phase 5 Monitoring & Reporting can begin — it will build on the admin attendance records view and the data layer established in Phases 3-4

---
*Phase: 04-admin-adjustments*
*Completed: 2026-03-02*
