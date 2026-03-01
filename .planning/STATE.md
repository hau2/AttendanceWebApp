# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Employees check in/out quickly with photo evidence — managers and admins have real-time, accurate attendance data — any company deployed in minutes with no IT support
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 1 of 3 in current phase
Status: Executing
Last activity: 2026-03-01 — Plan 01-01 complete: Supabase schema, RLS policies, and SDK integration

Progress: [█░░░░░░░░░] 7%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 7 min
- Total execution time: 7 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1 | 7 min | 7 min |

**Recent Trend:**
- Last 5 plans: 7 min
- Trend: Baseline established

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- One active shift per employee (not schedule-based) — keeps v1 simple
- No in-system correction request flow — Admin adjusts directly with audit trail
- No notifications in v1 — manual dashboard monitoring sufficient
- IP mode configurable per company (log-only vs enforce-block)
- Photos visible to Admin and Manager only; employees see their own only
- No face recognition in v1 — photo-as-evidence without AI
- Service-role key on backend bypasses RLS — never exposed to frontend (01-01)
- Anon key on frontend is subject to RLS — enforces tenant isolation at DB layer (01-01)
- JWT app_metadata.company_id used as RLS claim — auth token issuance (Phase 1 Plan 02) must populate this (01-01)
- SupabaseModule is @Global() — injectable anywhere in NestJS without re-import (01-01)

### Pending Todos

- Apply SQL migrations to Supabase before running backend (manual step — see 01-01-SUMMARY.md)
- Populate app_metadata.company_id in JWT when issuing tokens (required for RLS policies to work)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 01-01-PLAN.md — DB schema, RLS, Supabase SDK wired into NestJS and NextJS
Resume file: None
