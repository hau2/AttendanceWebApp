---
phase: 12-ui-polish
plan: 01
subsystem: ui
tags: [shadcn, lucide-react, react, tailwind, components]

# Dependency graph
requires: []
provides:
  - Shadcn CLI initialized with components.json and CSS token variables in globals.css
  - lucide-react installed and importable
  - src/components/ui/badge.tsx (Shadcn Badge)
  - src/components/ui/status-badge.tsx with StatusBadge and RemoteBadge exports
affects: [12-02, 12-03, 12-04]

# Tech tracking
tech-stack:
  added: [lucide-react, shadcn@3.8.5, class-variance-authority, clsx, tailwind-merge]
  patterns: [shared status badge component with icon map, pill-style inline badges with Lucide icons]

key-files:
  created:
    - frontend/components.json
    - frontend/src/lib/utils.ts
    - frontend/src/components/ui/badge.tsx
    - frontend/src/components/ui/status-badge.tsx
  modified:
    - frontend/package.json
    - frontend/src/app/globals.css

key-decisions:
  - "JSX.Element return type replaced with ReactElement from react (imported as type) — jsx: react-jsx tsconfig does not expose global JSX namespace"
  - "ElementType from react used for icon field in StatusConfig instead of React.ElementType — avoids React namespace import while keeping TypeScript strict"

patterns-established:
  - "StatusBadge pattern: STATUS_MAP record keyed by status string maps to {icon, cls, label}; missingCheckout prop handled before map lookup"
  - "RemoteBadge is a zero-prop component (is_remote boolean rendered as separate badge, not mixed with status strings)"

requirements-completed: [UIUX-02, UIUX-03]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 12 Plan 01: Shadcn + lucide-react Installation and StatusBadge Summary

**Shadcn UI initialized with CSS token variables, lucide-react installed, and shared StatusBadge/RemoteBadge components mapping all 7 attendance statuses to canonical Lucide icons per UIUX-02.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T23:41:19Z
- **Completed:** 2026-03-05T23:44:46Z
- **Tasks:** 2
- **Files modified:** 6 (created 4, updated 2)

## Accomplishments

- Shadcn CLI initialized non-interactively (`npx shadcn@latest init -d`) — writes `components.json`, injects CSS custom property tokens into `globals.css`, creates `src/lib/utils.ts`
- lucide-react installed and Badge component scaffolded via `npx shadcn@latest add badge`
- `status-badge.tsx` exports `StatusBadge` (7 status mappings + missingCheckout) and `RemoteBadge` — single source of truth for all attendance status display across plans 02-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Shadcn UI and lucide-react** - `7f667f1` (chore)
2. **Task 2: Create shared StatusBadge component** - `de2aad0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/components.json` - Shadcn configuration (style: default, base-color: neutral, Tailwind v4 mode)
- `frontend/src/lib/utils.ts` - cn() utility from Shadcn (clsx + tailwind-merge)
- `frontend/src/components/ui/badge.tsx` - Shadcn Badge pill component
- `frontend/src/components/ui/status-badge.tsx` - StatusBadge + RemoteBadge with full icon/color map
- `frontend/package.json` - added lucide-react, class-variance-authority, clsx, tailwind-merge
- `frontend/src/app/globals.css` - Shadcn CSS custom property tokens injected

## Decisions Made

- `JSX.Element` return type replaced with `ReactElement` imported as a type from react — the project's `jsx: react-jsx` tsconfig does not expose the global `JSX` namespace, causing TS2503 errors; named import from react resolves this cleanly
- `ElementType` from react used in the internal `StatusConfig` type for the icon field — avoids importing the React namespace while remaining TypeScript-strict

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS2503 JSX namespace errors in status-badge.tsx**
- **Found during:** Task 2 (Create shared StatusBadge component)
- **Issue:** Plan template used `JSX.Element` as return type, but `jsx: react-jsx` in tsconfig.json does not expose a global `JSX` namespace, causing two TypeScript errors (TS2503)
- **Fix:** Replaced `JSX.Element` with `ReactElement` (imported as type from react); replaced `React.ElementType` in StatusConfig with `ElementType` (also imported from react)
- **Files modified:** `frontend/src/components/ui/status-badge.tsx`
- **Verification:** `npx tsc --noEmit` passed with zero errors
- **Committed in:** de2aad0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type error in plan template)
**Impact on plan:** Fix required for correctness; no scope creep.

## Issues Encountered

None — Shadcn init completed without interactive prompts using `-d` flag. lucide-react installed without conflicts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `StatusBadge` and `RemoteBadge` are ready to import from `@/components/ui/status-badge` in plans 12-02, 12-03, 12-04
- Shadcn component infrastructure available for additional components (`npx shadcn@latest add <component>`)
- No blockers

## Self-Check: PASSED

All files confirmed present, all commits confirmed in git history.

---
*Phase: 12-ui-polish*
*Completed: 2026-03-05*
