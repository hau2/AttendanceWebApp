# Roadmap: Attendance SaaS

## Overview

The product is built in five sequential phases, each delivering a complete, verifiable capability. Phase 1 establishes the multi-tenant foundation — companies register, authenticate, and have security enforced at the database layer. Phase 2 gives Admins the tools to configure their workforce: users, roles, and shift definitions. Phase 3 delivers the core product value: employees check in and out with photo evidence, and the system classifies every record accurately. Phase 4 gives Admins the ability to correct records with a full audit trail. Phase 5 closes the loop with visibility: Managers monitor their teams, Executives see the company picture, and everyone can export data. Nothing is added for ceremony — each phase unblocks the next.

v2.0 adds six further phases (6–11): Division Architecture restructures how employees are grouped and how Managers are scoped; Employee Lifecycle and Per-User Timezone fill gaps in employee management; Remote Work and Acknowledgment Flow give Managers explicit confirmation of late/remote events; Advanced Monitoring brings absent statuses and richer filters; API Pagination adds offset-based pagination to all high-volume list endpoints; UI Polish unifies the visual language across all roles.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Multi-tenant auth, company onboarding, and RLS security baseline
- [x] **Phase 2: Workforce Configuration** - User management and shift definitions ready for attendance tracking
- [x] **Phase 3: Attendance Core** - Employee check-in/out with photo evidence and accurate late/early classification
- [x] **Phase 4: Admin Adjustments** - Admins can correct records with a full, immutable audit trail
- [x] **Phase 5: Monitoring & Reporting** - Manager monitoring, Executive dashboard, and CSV export
- [x] **Phase 6: Division Architecture** - DB schema + backend module + full Division Management UI; User Management updated to carry division_id (completed 2026-03-03)
- [x] **Phase 7: Employee Lifecycle + Per-User Timezone** - Delete employee (retain history), edit name/division/timezone, Manager creates employees in their divisions, per-user timezone in classification (completed 2026-03-03)
- [x] **Phase 8: Remote Work + Acknowledgment Flow** - Remote Work check-in option, Manager Acknowledge button for late/early/remote records, Employee sees acknowledgment status (completed 2026-03-04)
- [ ] **Phase 9: Advanced Monitoring** - Manual Data Refresh job (absent/absent-morning statuses), advanced status filters (5 filter types) in attendance tables
- [ ] **Phase 10: API Pagination** - Offset-based pagination (page/limit) on all high-volume list endpoints; paginated tables in frontend
- [ ] **Phase 11: UI Polish** - Live clock on Employee Home, Lucide status badge icons, Shadcn component upgrades, Executive drill-down, Manager Employee Detail page

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
**Plans**: 4 plans (02-01 through 02-04)

Plans:
- [x] 02-01-PLAN.md — NestJS UsersModule (create, list, role change, disable/enable, manager assignment) + DB migration
- [x] 02-02-PLAN.md — User Management UI (/admin/users page with all user CRUD, CSV import, manager assignment)
- [x] 02-03-PLAN.md — NestJS ShiftsModule (create, list, update) + /admin/shifts page
- [x] 02-04-PLAN.md — Shift assignment backend (POST /shifts/assign + active shift resolution) + AssignShiftModal on users page

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
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md — attendance_records SQL migration + RLS + NestJS AttendanceModule (check-in, check-out, history, records endpoints)
- [x] 03-02-PLAN.md — Supabase Storage photo bucket setup + POST /attendance/photo-upload-url signed URL endpoint
- [x] 03-03-PLAN.md — Midnight cron job (AttendanceCronService) for auto-marking missing checkouts
- [x] 03-04-PLAN.md — Employee dashboard check-in/out UI with camera capture (getUserMedia) + attendance API helpers
- [x] 03-05-PLAN.md — Employee history page (/attendance/history) + Admin/Manager attendance record view with inline photos (/admin/attendance)
- [x] 03-06-PLAN.md — Human verification checkpoint (full E2E attendance flow)

### Phase 4: Admin Adjustments
**Goal**: Admins can correct any attendance record — and every correction is fully auditable, with original values preserved forever
**Depends on**: Phase 3
**Requirements**: ADJT-01, ADJT-02, ADJT-03
**Success Criteria** (what must be TRUE):
  1. Admin can open any attendance record and edit the check-in or check-out time
  2. The system requires the Admin to provide a reason before saving any edit — saving without a reason is not possible
  3. After an edit, the audit trail shows who made the change, when, and the before/after values — and the original data is still visible and was never overwritten
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — attendance_adjustments SQL migration + NestJS adjustRecord() + PATCH /attendance/records/:id (admin/owner only)
- [x] 04-02-PLAN.md — AdjustAttendanceModal frontend component + Adjust button in detail modal + page refresh + E2E human verification

### Phase 5: Monitoring & Reporting
**Goal**: Managers can monitor their assigned employees' attendance in real time, Executives can see company-wide trends, and Admin/Managers can export data
**Depends on**: Phase 4
**Requirements**: MNGR-01, MNGR-02, MNGR-03, MNGR-04, MNGR-05, MNGR-06, EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, RPTS-01, RPTS-02, RPTS-03
**Success Criteria** (what must be TRUE):
  1. Manager can view attendance records for their assigned employees by day or by month, filter to a single employee, and read that employee's late reason or early-leave note — but cannot see any employee not assigned to them
  2. Manager can view a team summary showing total late count, punctuality rate, and monthly trend for their group
  3. Executive can view company-wide attendance rate, a ranking of employees by late frequency, and monthly aggregated summaries — and can drill into an individual employee's full history — but cannot edit any record
  4. Admin or Manager can generate a monthly attendance report, view late statistics, and export the data as a CSV file
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Manager-scoped listRecords + GET /attendance/reports/team-summary backend (MNGR-01 through MNGR-06)
- [x] 05-02-PLAN.md — Executive summary, monthly report, and CSV export backend endpoints (EXEC-01-05, RPTS-01-03)
- [x] 05-03-PLAN.md — Manager monitoring UI: team summary card + scoped employee dropdown on /admin/attendance (MNGR-01-06)
- [x] 05-04-PLAN.md — Executive dashboard page (/executive) + Admin/Manager reports page (/admin/reports) with CSV export (EXEC-01-05, RPTS-01-03)
- [x] 05-05-PLAN.md — Human verification checkpoint (all three role journeys: Manager, Executive, Admin reports + CSV)

### Phase 6: Division Architecture
**Goal**: Admins can create and manage Divisions, every Employee belongs to exactly one Division, and every Manager-scoped view across the entire application is filtered through Division membership rather than direct manager_id assignment
**Depends on**: Phase 5
**Requirements**: DIVN-01, DIVN-02, DIVN-03, DIVN-04, DIVN-05, DIVN-06, DIVN-07
**Success Criteria** (what must be TRUE):
  1. Admin can create a Division with a name and an assigned Manager, view all Divisions on a dedicated management page with their assigned Manager clearly listed, edit a Division's name or Manager, and delete a Division — deletion is blocked with an error if any employees are still assigned to it
  2. Every Employee record carries a division_id; Admin can assign or reassign any Employee to a Division from the User Management page
  3. When a Manager logs in and navigates to any attendance or employee view, they can only see Employees belonging to Divisions that Manager manages — no cross-division data leaks
  4. Admin and Executive can see all Divisions and all Employees across the entire company in every view
**Plans**: 6 plans

Plans:
- [x] 06-01-PLAN.md — DB migration (divisions table + users.division_id FK column + RLS policy)
- [x] 06-02-PLAN.md — NestJS DivisionsModule (POST/GET/PATCH/DELETE /divisions, delete guard against employee assignments)
- [x] 06-03-PLAN.md — Manager scope migration (attendance service uses division membership instead of manager_id) + divisionId in UpdateUserDto
- [x] 06-04-PLAN.md — Division Management UI (/admin/divisions page with Create/Edit/Delete modals + nav link)
- [x] 06-05-PLAN.md — User Management updates (Division column, assignment dropdown, division in Create User form)
- [x] 06-06-PLAN.md — Human verification checkpoint (full E2E: Division CRUD, assignment, manager scope, admin/exec scope)

### Phase 7: Employee Lifecycle + Per-User Timezone
**Goal**: Admins and Managers can manage the full employee lifecycle — including soft-deleting departed employees while preserving their attendance history — and employees working abroad get accurate late/early classification using their personal timezone instead of the company default
**Depends on**: Phase 6
**Requirements**: EMPL-01, EMPL-02, EMPL-03, EMPL-04, TZMG-01, TZMG-02
**Success Criteria** (what must be TRUE):
  1. Admin can delete an employee account; the account disappears from active lists but every historical attendance record for that employee still shows their name correctly
  2. Admin can edit an employee's full name, Division assignment, and personal timezone from the User Management page
  3. Manager can create a new Employee account and assign that employee to any Division the Manager manages — they cannot assign to a Division outside their scope
  4. When an employee has a personal timezone set, their check-in late/early classification uses that timezone; when no personal timezone is set, the company timezone applies — the two paths produce visibly different results for employees in different zones
  5. Admin and Executive can see which Manager (via Division) is responsible for each Employee in user listing and attendance views
**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md — DB migration (users.timezone nullable column)
- [x] 07-02-PLAN.md — Backend: DELETE /users/:id (soft-delete), PATCH /users/:id with fullName+timezone, Manager-scoped POST /users, GET /users with division manager join
- [x] 07-03-PLAN.md — Attendance timezone override: checkIn/checkOut use user.timezone ?? company.timezone for classification
- [x] 07-04-PLAN.md — Frontend: EditUserModal (name/division/timezone), Delete button + confirmation, Manager-scoped Create, Manager column in UserTable
- [x] 07-05-PLAN.md — Human verification checkpoint (all 6 requirements end-to-end)

### Phase 8: Remote Work + Acknowledgment Flow
**Goal**: Employees can declare Remote Work at check-in time, and Managers can explicitly acknowledge late, early-leave, and remote work records — with acknowledgment status visible to both Manager and Employee
**Depends on**: Phase 6
**Requirements**: RMOT-01, RMOT-02, ACKN-01, ACKN-02, ACKN-03, ACKN-04, ACKN-05
**Success Criteria** (what must be TRUE):
  1. Employee sees a "Remote Work" option during check-in; selecting it marks the record as remote and that record appears with a distinct "Remote" badge in Manager, Admin, and Employee views
  2. Manager can see the late reason or early-leave note directly on each relevant record in their monitoring view, and can click an Acknowledge button — the button is only present when the record has an unacknowledged late/early event
  3. Manager can click an Acknowledge button on a Remote Work check-in record to confirm awareness of the remote session
  4. Employee can open their own attendance history and see, for any acknowledged record, that their Manager has acknowledged it along with the acknowledgment timestamp
**Plans**: 4 plans

Plans:
- [x] 08-01-PLAN.md — DB migration: is_remote + 4 acknowledgment columns on attendance_records
- [x] 08-02-PLAN.md — Backend: CheckInDto is_remote field, acknowledgeRecord() + acknowledgeRemote() service methods, two POST controller routes
- [x] 08-03-PLAN.md — Frontend: Remote Work toggle in CheckInOutCard, Remote badge in all views, Acknowledge buttons in record detail, acknowledgment status in employee history
- [x] 08-04-PLAN.md — Human verification checkpoint (all 7 requirements end-to-end)

### Phase 9: Advanced Monitoring
**Goal**: Admins can manually trigger a Data Refresh to populate absent and absent-morning records for the current and previous day, and both Admins and Managers can filter the attendance table by any of five attendance status categories
**Depends on**: Phase 6
**Requirements**: RFSH-01, RFSH-02, RFSH-03, RFSH-04, FLTR-01, FLTR-02, FLTR-03, FLTR-04, FLTR-05
**Success Criteria** (what must be TRUE):
  1. Admin can click a "Data Refresh" button on the Admin Attendance page; after it runs, every active employee with no check-in record for today is marked "Absent Morning" and every active employee with no attendance record at all for yesterday is marked "Absent"
  2. The Admin Attendance page shows the date and time of the last Data Refresh run, updated immediately after each manual trigger
  3. Admin and Manager can filter the attendance table by "Late" and see only records where check-in was late; filter by "Early Leave" and see only records where check-out was early
  4. Admin and Manager can filter the attendance table by "Absent", "Absent Morning", or "Absent Afternoon" and see only records matching each respective status
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md — DB migration (011_data_refresh.sql: extend check_in_status constraint + add last_refresh_at to companies) + DataRefreshService + POST /attendance/refresh controller route
- [x] 09-02-PLAN.md — Frontend: triggerRefresh() API, getCompanySettings() with last_refresh_at, Data Refresh button + timestamp display, status filter dropdown (5 options)
- [x] 09-03-PLAN.md — Human verification checkpoint (all 9 requirements: RFSH-01 through RFSH-04, FLTR-01 through FLTR-05)

### Phase 10: API Pagination
**Goal**: Every GET list endpoint that can return unbounded rows is protected by offset-based pagination — the API never returns an uncapped dataset, the frontend renders paginated tables with page controls, and a shared PaginationDto makes the contract consistent across all modules
**Depends on**: Phase 9
**Requirements**: PAGI-01, PAGI-02, PAGI-03, PAGI-04
**Success Criteria** (what must be TRUE):
  1. GET /attendance/records accepts `page` and `limit` query params and returns `{ data, total, page, limit }` — requesting page 2 returns the correct slice of records and total reflects the full unfiltered count
  2. GET /attendance/reports/monthly accepts `page` and `limit` and returns paginated rows — the Admin/Manager monthly report table renders page controls and navigates without full reload
  3. GET /users accepts `page` and `limit` and returns paginated results — the User Management table renders page controls
  4. All paginated endpoints default to `limit=20` when no params are supplied; supplying `limit=0` or omitting params never crashes the server
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Shared PaginationDto + PaginatedResult; paginate GET /attendance/records (service + controller)
- [ ] 10-02-PLAN.md — Paginate GET /users (service + controller) + GET /attendance/reports/monthly (service + controller)
- [ ] 10-03-PLAN.md — Frontend: PaginationControls component + wire all three admin pages (Attendance, Users, Reports)

### Phase 11: UI Polish
**Goal**: Every role-specific UI surface is visually consistent — the Employee Home has a live clock, all status states carry a recognizable Lucide icon, new modals and tables use Shadcn components, and the Executive and Manager drill-down experiences are complete
**Depends on**: Phase 8, Phase 9
**Requirements**: UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05
**Success Criteria** (what must be TRUE):
  1. Employee Home page shows a live HH:MM:SS clock that ticks every second in the device's local timezone — the clock updates without any page reload
  2. Every attendance status badge (On-time, Late, Early Leave, Missing Checkout, Absent, Remote) displays a consistent Lucide icon alongside the text label in every view where status badges appear
  3. All new modals, dropdown selectors, data tables, and form components introduced in v2.0 use Shadcn UI components — no plain HTML tables or custom modal patterns for new UI added in this milestone
  4. Executive can click any employee row in the dashboard to open that employee's full attendance history in a read-only drill-down view
  5. Manager has a dedicated Employee Detail page showing one employee's complete monthly attendance table with late/early reasons and acknowledgment status visible inline
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete    | 2026-03-01 |
| 2. Workforce Configuration | 4/4 | Complete    | 2026-03-02 |
| 3. Attendance Core | 6/6 | Complete    | 2026-03-02 |
| 4. Admin Adjustments | 2/2 | Complete    | 2026-03-02 |
| 5. Monitoring & Reporting | 5/5 | Complete    | 2026-03-03 |
| 6. Division Architecture | 6/6 | Complete   | 2026-03-03 |
| 7. Employee Lifecycle + Per-User Timezone | 5/5 | Complete   | 2026-03-03 |
| 8. Remote Work + Acknowledgment Flow | 4/4 | Complete    | 2026-03-04 |
| 9. Advanced Monitoring | 3/3 | Complete | 2026-03-05 |
| 10. API Pagination | 1/3 | In progress | - |
| 11. UI Polish | 0/? | Not started | - |

---
*Roadmap created: 2026-03-01*
*Coverage: 53/53 v1 requirements mapped*
*Phase 1 planned: 2026-03-01 — 3 plans, 3 waves*
*Phase 3 planned: 2026-03-02 — 6 plans, 4 waves*
*Phase 4 planned: 2026-03-02 — 2 plans, 2 waves*
*Phase 5 planned: 2026-03-03 — 5 plans, 3 waves*
*v2.0 roadmap appended: 2026-03-03 — Phases 6–11, 34 requirements mapped (Phase 10 Pagination inserted 2026-03-06, UI Polish renumbered to Phase 11)*
*Phase 6 planned: 2026-03-03 — 6 plans, 4 waves*
*Phase 7 planned: 2026-03-03 — 5 plans, 3 waves*
*Phase 8 planned: 2026-03-04 — 4 plans, 4 waves*
*Phase 9 planned: 2026-03-04 — 3 plans, 3 waves*
*Phase 10 planned: 2026-03-06 — 3 plans, 3 waves*
*v2 Coverage: 34/34 v2 requirements mapped*
