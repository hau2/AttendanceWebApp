# Roadmap: Attendance SaaS

## Overview

The product is built in five sequential phases, each delivering a complete, verifiable capability. Phase 1 establishes the multi-tenant foundation — companies register, authenticate, and have security enforced at the database layer. Phase 2 gives Admins the tools to configure their workforce: users, roles, and shift definitions. Phase 3 delivers the core product value: employees check in and out with photo evidence, and the system classifies every record accurately. Phase 4 gives Admins the ability to correct records with a full audit trail. Phase 5 closes the loop with visibility: Managers monitor their teams, Executives see the company picture, and everyone can export data. Nothing is added for ceremony — each phase unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Multi-tenant auth, company onboarding, and RLS security baseline
- [ ] **Phase 2: Workforce Configuration** - User management and shift definitions ready for attendance tracking
- [ ] **Phase 3: Attendance Core** - Employee check-in/out with photo evidence and accurate late/early classification
- [ ] **Phase 4: Admin Adjustments** - Admins can correct records with a full, immutable audit trail
- [ ] **Phase 5: Monitoring & Reporting** - Manager monitoring, Executive dashboard, and CSV export

## Phase Details

### Phase 1: Foundation
**Goal**: Any company can register, configure their tenant, and their users can authenticate — with complete data isolation enforced at the database layer
**Depends on**: Nothing (first phase)
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, AUTH-01, AUTH-02, AUTH-03, SECU-01, SECU-02
**Success Criteria** (what must be TRUE):
  1. A new company owner can register with name, email, and password and a fully isolated tenant is created automatically
  2. After registration, the owner is walked through a setup wizard that captures timezone, creates a shift, and adds at least one user — in that order
  3. A user can log in with email and password, refresh the browser, and still be logged in
  4. A user can log out from any page and their session ends immediately
  5. No database query can return data belonging to a different company — enforced by Supabase Row Level Security, not application code
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — DB schema (companies, users, shifts), RLS policies, Supabase SDK integration for backend and frontend
- [x] 01-02-PLAN.md — Company registration + email/password auth (backend endpoints + frontend register/login pages + session middleware)
- [x] 01-03-PLAN.md — Company settings API, onboarding wizard (timezone → shift → first user), logout

### Phase 2: Workforce Configuration
**Goal**: Admins can build out the company's user roster and define work shifts so every employee has a role, a manager, and an assigned shift before attendance tracking begins
**Depends on**: Phase 1
**Requirements**: USER-01, USER-02, USER-03, USER-04, USER-05, USER-06, SHFT-01, SHFT-02, SHFT-03, SHFT-04
**Success Criteria** (what must be TRUE):
  1. Admin can create a user with any of the five roles (Owner, Admin, Manager, Employee, Executive) and that user can log in
  2. Admin can disable a user account and the disabled user cannot log in or perform any attendance action
  3. Admin can import a list of employees by uploading a CSV file
  4. Admin can assign a Manager to oversee specific employees, and that Manager sees only those employees in all views
  5. Admin can create a shift with start time, end time, and grace period — then assign it to an employee with an effective date — and that employee has exactly one active shift at any given time
**Plans**: TBD

### Phase 3: Attendance Core
**Goal**: Employees can check in and check out each workday — the system captures a camera photo and IP at the moment of action, classifies the record accurately against the employee's active shift, and prevents fraud and duplicate submissions
**Depends on**: Phase 2
**Requirements**: ATTN-01, ATTN-02, ATTN-03, ATTN-04, ATTN-05, ATTN-06, ATTN-07, ATTN-08, ATTN-09, ATTN-10, ATTN-11, ATTN-12, ATTN-13, EVID-01, EVID-02, EVID-03, EVID-04
**Success Criteria** (what must be TRUE):
  1. Employee opens their home page and sees a prominent CHECK-IN button; tapping it triggers the device camera and captures a photo — no file upload option exists
  2. After check-in, the system classifies the record as on-time, within-grace, or late (with exact minutes late shown) based on the employee's shift and the company's timezone; if late, the employee was required to enter a reason before submission completed
  3. After check-out, the system classifies the record as on-time or early (with exact minutes early shown); if early, the employee was required to enter a note before submission completed
  4. When midnight passes in the company timezone without a checkout, the system automatically marks that day's record as "missing checkout"
  5. Admin and Manager can open any attendance record and see the check-in and check-out photos inline; an employee can see their own photos but not another employee's
  6. When the company's IP policy is set to enforce-block, a check-in attempt from outside the allowlist is rejected with a clear message; when set to log-only, the attempt is recorded but not blocked
**Plans**: TBD

### Phase 4: Admin Adjustments
**Goal**: Admins can correct any attendance record — and every correction is fully auditable, with original values preserved forever
**Depends on**: Phase 3
**Requirements**: ADJT-01, ADJT-02, ADJT-03
**Success Criteria** (what must be TRUE):
  1. Admin can open any attendance record and edit the check-in or check-out time
  2. The system requires the Admin to provide a reason before saving any edit — saving without a reason is not possible
  3. After an edit, the audit trail shows who made the change, when, and the before/after values — and the original data is still visible and was never overwritten
**Plans**: TBD

### Phase 5: Monitoring & Reporting
**Goal**: Managers can monitor their assigned employees' attendance in real time, Executives can see company-wide trends, and Admin/Managers can export data
**Depends on**: Phase 4
**Requirements**: MNGR-01, MNGR-02, MNGR-03, MNGR-04, MNGR-05, MNGR-06, EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, RPTS-01, RPTS-02, RPTS-03
**Success Criteria** (what must be TRUE):
  1. Manager can view attendance records for their assigned employees by day or by month, filter to a single employee, and read that employee's late reason or early-leave note — but cannot see any employee not assigned to them
  2. Manager can view a team summary showing total late count, punctuality rate, and monthly trend for their group
  3. Executive can view company-wide attendance rate, a ranking of employees by late frequency, and monthly aggregated summaries — and can drill into an individual employee's full history — but cannot edit any record
  4. Admin or Manager can generate a monthly attendance report, view late statistics, and export the data as a CSV file
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-02 |
| 2. Workforce Configuration | 0/TBD | Not started | - |
| 3. Attendance Core | 0/TBD | Not started | - |
| 4. Admin Adjustments | 0/TBD | Not started | - |
| 5. Monitoring & Reporting | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-01*
*Coverage: 53/53 v1 requirements mapped*
*Phase 1 planned: 2026-03-01 — 3 plans, 3 waves*
