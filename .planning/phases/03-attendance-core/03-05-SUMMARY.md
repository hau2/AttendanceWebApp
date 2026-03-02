---
phase: "03"
plan: "05"
subsystem: frontend
tags: [attendance, history, admin-view, photos, role-guard]
dependency_graph:
  requires: ["03-01", "03-02", "03-04"]
  provides: ["attendance-history-ui", "admin-attendance-view", "photo-viewing"]
  affects: ["frontend/dashboard"]
tech_stack:
  added: []
  patterns: ["expandable-table-rows", "plain-tailwind-modal", "month-year-navigation", "role-guard-redirect"]
key_files:
  created:
    - frontend/src/app/(app)/attendance/history/page.tsx
    - frontend/src/app/(app)/attendance/history/components/AttendanceHistoryTable.tsx
    - frontend/src/app/(app)/admin/attendance/page.tsx
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx
  modified:
    - frontend/src/lib/api/attendance.ts
    - frontend/src/app/(app)/dashboard/page.tsx
decisions:
  - "Expandable row pattern used for employee history (inline chevron) rather than separate modal — keeps table compact"
  - "Admin attendance page uses breadcrumb nav links (Users / Shifts / Attendance Records) — consistent with Phase 2 admin area"
  - "AttendanceRecordDetail uses plain Tailwind modal overlay (fixed inset-0) — consistent with Phase 2 modal pattern"
metrics:
  duration: "~8 min"
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 3 Plan 05: Attendance History Views Summary

**One-liner:** Employee monthly history at /attendance/history and admin attendance records at /admin/attendance with inline check-in/check-out photo viewing via modal.

## What Was Built

### Task 1: Employee attendance history page (commit: 62cb1f1)
- Added `listRecords()` function and `AttendanceRecordWithUser` interface to `frontend/src/lib/api/attendance.ts`
- Created `/attendance/history` page with month/year navigation (prev/next buttons), fetches records on month change
- Role guard: admin/owner roles are redirected to `/admin/attendance`; employees and managers see their own records only
- `AttendanceHistoryTable` renders records with status badges (green=on-time, yellow=within-grace, red=late, orange=early, gray=missing checkout), check-in/out times, minutes late/early
- Expandable rows: clicking chevron reveals check-in and check-out photo thumbnails (or "No photo" placeholder) plus late_reason and early_note
- Added "View History" link below CheckInOutCard on dashboard for employee/manager roles

### Task 2: Admin/Manager attendance record view (commit: b5daf97)
- Created `/admin/attendance` page with month/year navigation, employee filter dropdown, and role guard (redirects non-admin/manager/owner to `/dashboard`)
- `AttendanceRecordTable` lists all company records with employee name, date, check-in/out times, status badges, and "View" button
- `AttendanceRecordDetail` plain Tailwind modal shows full record: employee name, date, check-in section (time + status + minutes + late_reason + photo), check-out section (time + status + minutes + early_note + photo), missing checkout red alert
- Photos render as `<img className="w-full max-w-xs h-48 object-cover rounded-lg">` — "No photo captured" shown when URL is null
- Navigation breadcrumbs (Users / Shifts / Attendance Records) at top of admin attendance page

## Verification

- `npm run build` exits 0 with zero TypeScript errors — all 12 routes generated cleanly
- /attendance/history: fetches GET /attendance/history, renders AttendanceHistoryTable, month nav changes data
- /admin/attendance: fetches GET /attendance/records with optional userId param, renders AttendanceRecordTable
- Employee filter dropdown lists all company users from GET /users
- AttendanceRecordDetail: inline photos with null-safe rendering
- Status badges consistent across both views (same color mapping)
- Role guards implemented in both pages

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] frontend/src/app/(app)/attendance/history/page.tsx — exists
- [x] frontend/src/app/(app)/attendance/history/components/AttendanceHistoryTable.tsx — exists
- [x] frontend/src/app/(app)/admin/attendance/page.tsx — exists
- [x] frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx — exists
- [x] frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx — exists
- [x] Commit 62cb1f1 — Task 1 (history page + listRecords)
- [x] Commit b5daf97 — Task 2 (admin attendance view)
- [x] npm run build exits 0

## Self-Check: PASSED
