---
phase: 12-ui-polish
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwindcss, lucide, shadcn, status-badge, live-clock]

# Dependency graph
requires:
  - phase: 12-ui-polish plan 01
    provides: StatusBadge and RemoteBadge shared components in frontend/src/components/ui/status-badge.tsx
provides:
  - Live HH:MM:SS clock on employee home dashboard (UIUX-01)
  - StatusBadge/RemoteBadge wired into AttendanceHistoryTable, AttendanceRecordTable, AttendanceRecordDetail (UIUX-02)
affects:
  - 12-ui-polish
  - Any future plan modifying dashboard/page.tsx or attendance views

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live clock with setInterval in separate useEffect — initialised immediately on mount, cleaned up via clearInterval on unmount"
    - "Shared StatusBadge/RemoteBadge replaces all inline status badge implementations across attendance views"

key-files:
  created: []
  modified:
    - frontend/src/app/(app)/dashboard/page.tsx
    - frontend/src/app/(app)/attendance/history/components/AttendanceHistoryTable.tsx
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx
    - frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx

key-decisions:
  - "Clock initialised once before setInterval to show time immediately on mount with no 1-second blank delay"
  - "Separate useEffect for clock (not merged with user fetch useEffect) — keeps concerns isolated"
  - "toLocaleTimeString with hour12: false provides HH:MM:SS format using device local timezone without any timezone option"

patterns-established:
  - "Live clock pattern: getClockString() helper + useState('') + useEffect with setInterval + clearInterval cleanup"
  - "Badge migration pattern: remove local statusBadge function, add named import of StatusBadge/RemoteBadge, replace JSX callsites one-to-one"

requirements-completed: [UIUX-01, UIUX-02]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 12 Plan 02: Clock + Badge Consolidation Summary

**Live HH:MM:SS clock on Employee Home and unified Lucide icon status badges across all three attendance views via shared StatusBadge/RemoteBadge components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T23:47:24Z
- **Completed:** 2026-03-05T23:49:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Employee Home dashboard now shows a live ticking 24h clock (HH:MM:SS) using device local timezone, initialized immediately on mount with setInterval cleanup on unmount
- AttendanceHistoryTable, AttendanceRecordTable, and AttendanceRecordDetail all had their local inline `statusBadge` functions removed and replaced with the shared `StatusBadge` and `RemoteBadge` from plan 12-01
- Remote badge now shows Laptop icon in all three views via `RemoteBadge`
- Missing checkout case in AttendanceRecordTable uses `StatusBadge` with `missingCheckout` prop

## Task Commits

Each task was committed atomically:

1. **Task 1: Add live HH:MM:SS clock to Employee Home** - `e8c0030` (feat)
2. **Task 2: Wire StatusBadge into all attendance views** - `8e8b73f` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified
- `frontend/src/app/(app)/dashboard/page.tsx` - Added `clock` state, separate `useEffect` with `setInterval` at 1000ms, `getClockString()` helper, clock JSX below date
- `frontend/src/app/(app)/attendance/history/components/AttendanceHistoryTable.tsx` - Removed local `statusBadge`, imported `StatusBadge`/`RemoteBadge`, replaced all badge callsites
- `frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx` - Removed local `statusBadge`, imported `StatusBadge`/`RemoteBadge`, replaced all badge callsites including missing-checkout case
- `frontend/src/app/(app)/admin/attendance/components/AttendanceRecordDetail.tsx` - Removed local `statusBadge`, imported `StatusBadge`/`RemoteBadge`, replaced check-in/out status and remote badge

## Decisions Made
- Clock initialized via `setClock(getClockString())` before the `setInterval` starts so there is no one-second blank display on mount
- Clock lives in its own `useEffect` (not merged with the user fetch effect) to keep concerns isolated and ensure the clock runs even before the user state resolves
- `toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })` uses device local timezone by default — no explicit `timeZone` option needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `frontend/src/components/ui/dialog.tsx` (from plan 12-01 Shadcn scaffolding) references `@/components/ui/button` which was not fully generated. This is out-of-scope for this plan and does not affect any of the four files modified here. All four target files compile cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UIUX-01 (live clock) and UIUX-02 (icon badges everywhere) are satisfied
- All attendance views now use the shared StatusBadge/RemoteBadge — future badge changes only need to touch `status-badge.tsx`
- Remaining plan 12-03 (if any) can build on this foundation

---
*Phase: 12-ui-polish*
*Completed: 2026-03-06*
