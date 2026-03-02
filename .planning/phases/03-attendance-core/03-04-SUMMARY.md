---
phase: 03-attendance-core
plan: "04"
subsystem: frontend-attendance-ui
tags: [attendance, camera, check-in, check-out, dashboard, frontend]
dependency_graph:
  requires: ["03-01", "03-02"]
  provides: ["dashboard-check-in-ui", "attendance-api-helpers"]
  affects: ["frontend-dashboard"]
tech_stack:
  added: []
  patterns:
    - "getUserMedia camera capture (no file input)"
    - "Signed URL photo upload (PUT blob to Supabase Storage)"
    - "Backend-driven late/early classification via 400 error response"
    - "State machine: idle -> camera-open -> photo-preview -> submitting -> error"
key_files:
  created:
    - frontend/src/lib/api/attendance.ts
    - frontend/src/app/(app)/dashboard/components/CheckInOutCard.tsx
  modified:
    - frontend/src/app/(app)/dashboard/page.tsx
decisions:
  - "Backend-driven late reason / early note: attempt submission first; show field only on 400 — avoids duplicating classification logic in frontend"
  - "facingMode: environment with fallback to { video: true } — supports mobile rear camera with desktop fallback"
  - "getTodayRecord on mount restores state so page refresh shows correct button (CHECK-IN vs CHECK-OUT vs done)"
metrics:
  duration: "8 min"
  completed_date: "2026-03-02"
  tasks_completed: 2
  files_changed: 3
requirements:
  - ATTN-01
  - ATTN-02
  - ATTN-04
  - ATTN-05
  - ATTN-07
  - EVID-02
---

# Phase 3 Plan 4: Dashboard Check-In/Out UI Summary

**One-liner:** Camera-only check-in/out dashboard with getUserMedia capture, signed-URL photo upload, and backend-driven late/early reason prompting.

## What Was Built

The employee-facing dashboard now has a full check-in/out flow:

1. **attendance.ts API helpers** — `checkIn`, `checkOut`, `getTodayRecord`, `getPhotoUploadUrl`, `uploadPhotoBlob`, `getHistory` with full `AttendanceRecord` TypeScript interface.

2. **CheckInOutCard component** — State machine managing:
   - Camera activation via `getUserMedia` (no `<input type="file">`)
   - Live video preview + single-click Capture
   - Photo upload to Supabase Storage via signed URL (PUT blob)
   - `checkIn`/`checkOut` submission with `permanentUrl` as `photo_url`
   - Late reason field shown only after backend returns 400 "requires a reason"
   - Early note field shown only after backend returns 400 "requires a note"
   - IP block 403 shows "Check-in blocked: your IP address is not in the company allowlist"
   - Page refresh restores correct state via `getTodayRecord()` on mount

3. **Dashboard page** — Role-aware: employee/manager roles see `CheckInOutCard`; admin/owner/executive roles see placeholder (Phase 5 dashboard).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files created:
- frontend/src/lib/api/attendance.ts — FOUND
- frontend/src/app/(app)/dashboard/components/CheckInOutCard.tsx — FOUND
- frontend/src/app/(app)/dashboard/page.tsx — FOUND (modified)

Commits:
- cf0fc01 feat(03-04): attendance API helper functions
- 73224c6 feat(03-04): CheckInOutCard component and role-aware dashboard page

Build: PASSED (0 TypeScript errors, all routes static)

## Self-Check: PASSED
