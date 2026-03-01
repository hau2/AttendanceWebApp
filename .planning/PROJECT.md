# Attendance Web App

## What This Is

A multi-tenant SaaS web application that allows companies to track employee attendance through check-in and check-out events, capturing photo evidence via device camera, detecting late/early/missing attendance, and providing managers and executives with reporting dashboards. Companies self-register and onboard through a guided setup wizard. This system handles time tracking only — no salary calculation.

## Core Value

Employees can check in and out with camera evidence, and managers can see who's on time, who's late, and who's missing — all scoped to their company with full audit trail.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-tenant isolation: all data scoped by `company_id` with RLS
- [ ] Self-service company registration with guided setup wizard (timezone → shifts → users)
- [ ] Five roles: ROOT, IT, MANAGER, EMPLOYEE, EXEC with enforced permission scopes
- [ ] Employee check-in and check-out with mandatory camera capture (no file upload)
- [ ] Late detection: grace period (5 min), `late_minutes`, `late_category` (none / within_grace / beyond_grace)
- [ ] Early leave detection: `early_minutes` computed, note required
- [ ] Mandatory note when late or checking out early
- [ ] IP allowlist: store and flag `checkin_ip_in_allowlist` / `checkout_ip_in_allowlist` (MVP does not block — flags only)
- [ ] One attendance record per user per day: unique `(company_id, user_id, work_date)`
- [ ] Midnight cron job: auto-mark missing checkout as `status='missing'`, `source='system'`
- [ ] Photo retention job: delete photos older than `retention_days` (company-configurable, default 180)
- [ ] IT-only attendance adjustment with full audit trail (`attendance_adjustments` table)
- [ ] Manager view: team attendance, filter by date, employee drill-down
- [ ] Executive view: company-wide stats, top late employees, attendance rate
- [ ] CSV export: attendance filtered by date range
- [ ] CSV import: user bulk import
- [ ] Employee self-view: own attendance history and submitted notes

### Out of Scope

- Salary / payroll calculation — system is time tracking only, by design
- Face recognition / biometric verification — post-MVP
- Geo-fencing — post-MVP
- Mobile native app — web-first, mobile later
- Note approval workflow — MVP: manager can view notes, no approval flow
- Real-time notifications — post-MVP
- Device binding — post-MVP
- Blocking check-in outside IP allowlist — MVP flags only, does not block

## Context

- **Tech stack is locked**: NestJS (API) + NextJS (frontend) + Supabase (Postgres + Auth + Storage) + Shadcn + TailwindCSS
- **Supabase Auth** handles authentication; `users.id` = `auth.uid`
- **RLS required** on all tenant-scoped tables — queries always filtered by `company_id`
- **Timezone-aware**: all attendance calculations use the company's configured timezone (`companies.timezone`)
- **Shift assignments** drive `work_date` resolution — each user has an active shift with `start_time`, `end_time`, `effective_from_date`
- **Evidence capture**: camera only via browser MediaDevices API, preview before submit, front camera preferred on mobile
- **Background jobs**: midnight job (per-company timezone) + daily photo retention cleanup — likely implemented as Supabase Edge Functions or NestJS scheduled tasks
- **Onboarding wizard flow**: (1) Company settings → (2) Create initial shift → (3) Add/invite first users (CSV import optional) → company ready

## Constraints

- **Tech Stack**: NestJS + NextJS + Supabase — no substitutions
- **Evidence**: Camera capture only — no file upload path anywhere in the UI
- **Multi-tenancy**: Every DB query must be scoped by `company_id`; RLS enforces this at DB layer
- **Audit**: IT adjustments must never silently overwrite — always create `attendance_adjustments` record and recompute metrics
- **One record per day**: Unique constraint `(company_id, user_id, work_date)` — no duplicate records

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth for auth | Simplifies multi-tenant auth, `auth.uid` = user identity | — Pending |
| Camera-only evidence (no upload) | Prevents falsification of check-in photos | — Pending |
| MVP: IP allowlist flags but does not block | Reduces false positives while building trust in data | — Pending |
| Guided onboarding wizard (not manual setup) | ROOT needs a clear path from registration to live use | — Pending |
| NestJS backend (not Supabase-only) | Complex business logic (timezone calculations, cron jobs, adjustment rules) benefits from an explicit API layer | — Pending |

---
*Last updated: 2026-03-01 after initialization*
