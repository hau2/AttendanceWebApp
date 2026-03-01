# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Employees check in/out quickly with photo evidence — managers and admins have real-time, accurate attendance data — any company deployed in minutes with no IT support
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 2 of 3 in current phase
Status: Awaiting human verification (checkpoint after 01-02)
Last activity: 2026-03-01 — Plan 01-02 complete: NestJS JWT auth endpoints + frontend register/login pages + middleware

Progress: [██░░░░░░░░] 13%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 5 min
- Total execution time: 10 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 10 min | 5 min |

**Recent Trend:**
- Last 5 plans: 7 min, 3 min
- Trend: Accelerating

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
- JWT app_metadata.company_id used as RLS claim — populated in auth.admin.createUser() during registration (01-02)
- SupabaseModule is @Global() — injectable anywhere in NestJS without re-import (01-01)
- Non-httpOnly cookie for access_token — Next.js Edge middleware cannot read httpOnly cookies (01-02)
- Atomic registration uses sequential operations with manual rollback — Supabase Auth Admin API and DB are independent systems (01-02)
- tsconfig @/* alias points to ./src/* — app/ is at root but source utilities live under src/ (01-02)

### Pending Todos

- Apply SQL migrations to Supabase before running backend (manual step — see 01-01-SUMMARY.md)
- Copy backend/.env.example to backend/.env with Supabase credentials, JWT_SECRET, FRONTEND_URL
- Copy frontend/.env.example to frontend/.env.local with Supabase credentials and NEXT_PUBLIC_API_URL
- Human verification of auth flow required before proceeding to 01-03 (see 01-02 checkpoint)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 01-02-PLAN.md — JWT auth endpoints, frontend auth pages, middleware — AWAITING HUMAN VERIFICATION
Resume file: None
