# Attendance SaaS

## What This Is

A multi-tenant SaaS web application that helps businesses track employee attendance transparently and accurately. Companies self-onboard in minutes, configure work shifts, add employees, and immediately start collecting daily check-in/check-out records with photo evidence. Built for the Vietnamese market but designed as a generic SaaS platform deployable to any business.

## Core Value

Employees can check in/out quickly with photo evidence captured at the moment of action — while managers and admins have real-time, accurate attendance data — deployed by any company in minutes with no IT support needed.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Company Onboarding**
- [ ] Owner can register a new company (name, email, password) — system creates an isolated tenant automatically
- [ ] Owner is guided through a setup wizard after registration (timezone → shift → users)
- [ ] Owner/Admin can configure company timezone (required — affects all late/early calculations)
- [ ] Owner/Admin can configure IP restriction mode: log-only or enforce-block (optional setting)

**User Management**
- [ ] Admin can create users with roles: Owner, Admin, Manager, Employee, Executive
- [ ] Admin can change a user's role
- [ ] Admin can disable/enable a user account
- [ ] Admin can import employees via CSV
- [ ] Admin can assign a Manager to oversee specific employees

**Shift Management**
- [ ] Admin can create work shifts (start time, end time, grace period in minutes)
- [ ] Admin can edit existing shifts
- [ ] Admin can assign a shift to an employee with an effective date
- [ ] Each employee has one active shift at a time

**Employee Check-in/Out**
- [ ] Employee sees a prominent CHECK-IN button on their home page
- [ ] Check-in captures: timestamp, photo (camera only — no file upload), IP address
- [ ] System calculates late status: on-time, within-grace, or late (with minutes late)
- [ ] Employee must enter a reason if checking in late
- [ ] Check-out captures: timestamp, photo, IP address
- [ ] System calculates early-leave status and minutes early
- [ ] Employee must enter a note if checking out early
- [ ] System auto-marks records as "missing checkout" if midnight passes without checkout (source = system)

**Evidence & Photos**
- [ ] Photos are stored per attendance record and viewable by Admin and Manager in record detail
- [ ] Photos captured from device camera only — no file upload allowed
- [ ] Photos retained for 90–180 days per record

**Attendance Adjustment (Admin)**
- [ ] Admin can edit check-in/out times on any attendance record
- [ ] Admin must provide a reason when editing a record
- [ ] System stores full audit trail: who changed, when, before/after values — original data never deleted

**Manager Monitoring**
- [ ] Manager sees only employees assigned to them
- [ ] Manager can view attendance by day or by month
- [ ] Manager can filter by individual employee
- [ ] Manager can view employee notes (late reasons, early-leave notes)
- [ ] Manager can view photos embedded in attendance records
- [ ] Manager can see team report: total lates, punctuality rate, monthly trend

**Executive Dashboard**
- [ ] Executive can view company-wide attendance rate
- [ ] Executive can view top employees by late frequency
- [ ] Executive can view monthly aggregated summaries
- [ ] Executive can drill down to individual employee records
- [ ] Executive has read-only access — no editing

**Reports & Export**
- [ ] Admin/Manager can generate monthly attendance reports
- [ ] Admin/Manager can view late statistics
- [ ] Admin/Manager can export attendance data as CSV

**Security & Multi-tenancy**
- [ ] Every company's data is isolated — no cross-tenant data access
- [ ] All database queries scoped by company_id via Row Level Security (Supabase RLS)

### Out of Scope

- Payroll calculation — explicit v1 boundary; not an attendance system responsibility
- Face recognition — photos stored as visual evidence only, no AI matching in v1
- Native mobile app — web-first; mobile browser supported but no native app
- GPS / geolocation check-in — IP-based restriction is sufficient for v1
- In-system correction request workflow — employees notify Admin offline; Admin adjusts directly
- Email / push notifications — Managers monitor via dashboard manually; deferred to v2
- Per-day/per-week shift scheduling — one active shift per employee; complex scheduling deferred

## Context

- **Market**: Vietnamese SMB/enterprise market initially; product designed as generic multi-tenant SaaS
- **Codebase**: NestJS backend + NextJS frontend scaffolded (empty, no business features yet); Supabase as database and auth layer
- **Photo storage**: Requires object storage for attendance photos (Supabase Storage or equivalent)
- **Timezone sensitivity**: All late/early logic depends on the company's configured timezone — misconfiguration breaks all data accuracy; enforced in setup wizard

## Constraints

- **Tech Stack**: NestJS (backend) + NextJS (frontend) + Supabase (DB + Auth) + TailwindCSS + Shadcn — decided, not up for debate
- **Directory structure**: `./backend` (NestJS) · `./frontend` (NextJS) — both scaffolded, no business features yet
- **Full-stack delivery**: Every phase must deliver end-to-end functionality — backend API + frontend UI together. No backend-only phases.
- **Scope boundary**: No payroll in v1 — any payroll-adjacent features deferred to a separate product or future milestone
- **Photo capture**: Camera-only — no file upload — to reduce fraud risk
- **Multi-tenancy**: Row Level Security enforced at DB layer — every query must include company_id scope

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One active shift per employee (not schedule-based) | Keeps v1 simple; complex scheduling deferred pending real customer demand | — Pending |
| No in-system correction request flow | Admin adjusts directly with audit trail; offline notification sufficient for v1 | — Pending |
| No notifications in v1 | Manual dashboard monitoring sufficient; notifications deferred to v2 | — Pending |
| IP mode configurable per company (log-only vs enforce-block) | Different companies have different security needs; both modes needed from day 1 | — Pending |
| Photos visible to Admin and Manager in records | Evidence available for routine monitoring and disputes without mandatory review workflow | — Pending |
| No face recognition in v1 | Significant complexity and cost; photo-as-evidence achieves anti-fraud goal without AI | — Pending |

---
*Last updated: 2026-03-01 after adding full-stack delivery constraint*
