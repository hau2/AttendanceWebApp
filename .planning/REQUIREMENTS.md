# Requirements: Attendance SaaS

**Defined:** 2026-03-01
**Core Value:** Employees can check in/out quickly with photo evidence — while managers and admins have real-time, accurate attendance data — deployed by any company in minutes with no IT support needed.

## v1 Requirements

Requirements for initial release. Each maps to a roadmap phase.

### Onboarding (ONBD)

- [x] **ONBD-01**: Owner can register a new company (name, email, password) — system creates isolated tenant automatically
- [x] **ONBD-02**: Owner is guided through setup wizard after registration (timezone → shift → first users)
- [x] **ONBD-03**: Owner/Admin can configure company timezone (required before any attendance tracking begins)
- [x] **ONBD-04**: Owner/Admin can configure IP restriction mode per company: log-only or enforce-block

### Authentication (AUTH)

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: User can log out from any page

### User Management (USER)

- [x] **USER-01**: Admin can create users with assigned roles (Owner, Admin, Manager, Employee, Executive)
- [x] **USER-02**: Admin can change a user's role
- [x] **USER-03**: Admin can disable or enable a user account
- [ ] **USER-04**: Admin can import employees via CSV
- [x] **USER-05**: Admin can assign a Manager to oversee specific employees
- [x] **USER-06**: Disabled users cannot log in or perform attendance actions

### Shift Management (SHFT)

- [x] **SHFT-01**: Admin can create work shifts (start time, end time, grace period in minutes)
- [x] **SHFT-02**: Admin can edit existing shifts
- [x] **SHFT-03**: Admin can assign a shift to an employee with an effective date
- [x] **SHFT-04**: Each employee has exactly one active shift at any given time

### Attendance (ATTN)

- [x] **ATTN-01**: Employee sees a prominent CHECK-IN button on their home page
- [x] **ATTN-02**: Check-in captures timestamp, photo (camera only), IP address, and late classification
- [x] **ATTN-03**: System classifies check-in as on-time, within-grace, or late — with minutes late recorded
- [x] **ATTN-04**: Employee must enter a reason if checking in late
- [x] **ATTN-05**: Check-out captures timestamp, photo, and IP address
- [x] **ATTN-06**: System classifies checkout as on-time or early — with minutes early recorded
- [x] **ATTN-07**: Employee must enter a note if checking out early
- [x] **ATTN-08**: System auto-marks record as "missing checkout" after midnight (company timezone) if no checkout occurred
- [x] **ATTN-09**: System enforces exactly one attendance record per employee per work_date
- [x] **ATTN-10**: Employee can view their own attendance history by month
- [x] **ATTN-11**: System records whether each check-in/check-out IP is within the company's IP allowlist
- [x] **ATTN-12**: When IP policy is enforce-block, check-in/out attempts from outside the allowlist are rejected with a clear user message
- [x] **ATTN-13**: System prevents duplicate check-in or check-out submissions for the same work_date (idempotent behavior)

### Evidence / Photos (EVID)

- [x] **EVID-01**: Attendance photos are stored per record and visible to Admin and Manager in record detail
- [x] **EVID-02**: Photo capture uses device camera only — file upload is not permitted
- [x] **EVID-03**: Photos are retained for 90–180 days per record
- [x] **EVID-04**: Employee can view their own attendance photos but cannot access photos of other employees

### Admin Adjustments (ADJT)

- [x] **ADJT-01**: Admin can edit check-in or check-out times on any attendance record
- [x] **ADJT-02**: Admin must provide a reason when editing an attendance record
- [x] **ADJT-03**: System stores full audit trail per edit: who changed, when, before/after values — original data never deleted

### Manager Monitoring (MNGR)

- [x] **MNGR-01**: Manager can only view employees assigned to them
- [x] **MNGR-02**: Manager can view attendance records by day or by month
- [x] **MNGR-03**: Manager can filter records by individual employee
- [x] **MNGR-04**: Manager can read employee notes (late reasons, early-leave explanations)
- [x] **MNGR-05**: Manager can view photos embedded in attendance records
- [x] **MNGR-06**: Manager can view team report: total late count, punctuality rate, monthly trend

### Executive Dashboard (EXEC)

- [x] **EXEC-01**: Executive can view company-wide attendance rate
- [x] **EXEC-02**: Executive can view employees ranked by late frequency
- [x] **EXEC-03**: Executive can view monthly aggregated attendance summaries
- [x] **EXEC-04**: Executive can drill down to individual employee attendance history
- [x] **EXEC-05**: Executive has read-only access — no editing

### Reports & Export (RPTS)

- [x] **RPTS-01**: Admin and Manager can generate monthly attendance reports
- [x] **RPTS-02**: Admin and Manager can view late statistics
- [x] **RPTS-03**: Admin and Manager can export attendance data to CSV

### Security (SECU)

- [x] **SECU-01**: Each company's data is fully isolated — no cross-tenant access possible
- [x] **SECU-02**: All database queries scoped by company_id via Supabase Row Level Security

## v2 Requirements (Current Milestone — v2.0)

### Division Management (DIVN)

- [x] **DIVN-01**: Admin can create a Division with a name and assign a Manager to it
- [x] **DIVN-02**: Admin can view all Divisions in a dedicated management page, with the assigned Manager clearly displayed per Division
- [x] **DIVN-03**: Admin can edit a Division's name or reassign its Manager
- [x] **DIVN-04**: Admin can delete a Division (system prevents deletion if employees are still assigned)
- [ ] **DIVN-05**: Each Employee belongs to exactly one Division; Admin and Manager can assign or reassign an Employee's Division
- [ ] **DIVN-06**: Manager can only view the Divisions they manage and the Employees within those Divisions across all views
- [ ] **DIVN-07**: Admin and Executive can view all Divisions and all Employees company-wide across all views

### Employee Lifecycle (EMPL)

- [x] **EMPL-01**: Admin can delete an employee account when the employee leaves; all historical attendance records are retained with the employee's name visible
- [x] **EMPL-02**: Admin can edit an employee's full name, Division assignment, and personal timezone
- [x] **EMPL-03**: Manager can create a new Employee account and assign that employee to any Division the Manager manages
- [x] **EMPL-04**: Admin and Executive can see which Manager (via Division) is responsible for each Employee in user listing and attendance views

### Per-User Timezone (TZMG)

- [x] **TZMG-01**: Admin can set a personal timezone override on any employee's profile (for employees on overseas assignment)
- [ ] **TZMG-02**: Attendance late/early classification uses the employee's personal timezone when set; falls back to company timezone otherwise

### Acknowledgment Flow (ACKN)

- [x] **ACKN-01**: Manager can see the late reason and early-leave note for each attendance record in their monitoring view
- [x] **ACKN-02**: Manager can click an "Acknowledge" button on a late or early-leave record to confirm they have seen the reason
- [x] **ACKN-03**: Employee can see in their attendance history that their Manager has acknowledged their late reason or early-leave note (with timestamp)
- [x] **ACKN-04**: Manager can click an "Acknowledge" button on a Remote Work check-in to confirm they are aware
- [x] **ACKN-05**: Employee can see in their attendance history that their Manager has acknowledged their Remote Work check-in (with timestamp)

### Remote Work (RMOT)

- [x] **RMOT-01**: Employee can select a "Remote Work" option when checking in, indicating they are working from outside the office
- [x] **RMOT-02**: Remote Work check-ins are visually flagged with a distinct "Remote" badge in Manager, Admin, and Employee views

### Data Refresh (RFSH)

- [x] **RFSH-01**: Admin can manually trigger a Data Refresh job via a button on the Admin Attendance page
- [x] **RFSH-02**: Data Refresh marks every active employee with no check-in record for today as "Absent Morning" (intended to run at or after 12:00 PM)
- [x] **RFSH-03**: Data Refresh marks every active employee with no attendance record at all for yesterday as "Absent" (full day absent)
- [x] **RFSH-04**: Admin can see the date and time of the last Data Refresh run on the attendance page

### Advanced Attendance Filters (FLTR)

- [x] **FLTR-01**: Admin and Manager can filter the attendance table by "Late" — shows only records where check-in was classified as late
- [x] **FLTR-02**: Admin and Manager can filter the attendance table by "Early Leave" — shows only records where check-out was classified as early
- [x] **FLTR-03**: Admin and Manager can filter the attendance table by "Absent" — shows only records marked as absent (no show all day)
- [x] **FLTR-04**: Admin and Manager can filter the attendance table by "Absent Morning" — shows only records where no check-in was recorded before 12:00 PM
- [x] **FLTR-05**: Admin and Manager can filter the attendance table by "Absent Afternoon" — shows only records where check-in exists but no check-out was recorded after 12:00 PM

### API Pagination (PAGI)

- [x] **PAGI-01**: GET /attendance/records accepts `page` and `limit` query params and returns `{ data, total, page, limit }` — requesting page 2 returns the correct slice; total reflects the full unfiltered count
- [x] **PAGI-02**: GET /attendance/reports/monthly accepts `page` and `limit` and returns paginated rows — the Admin/Manager monthly report table renders page controls and navigates without full reload
- [x] **PAGI-03**: GET /users accepts `page` and `limit` and returns paginated results — the User Management table renders page controls
- [x] **PAGI-04**: All paginated endpoints default to `limit=20` when no params are supplied; supplying `limit=0` or omitting params never crashes the server

### IP Restriction (IPRX)

- [x] **IPRX-01**: Admin can configure IP restriction mode per company: disabled, log-only, or enforce-block — mode persists across sessions
- [x] **IPRX-02**: Admin can manage a company-wide IP allowlist — add entries as single IPv4 addresses or CIDR ranges (e.g. 192.168.1.0/24) with an optional label; delete individual entries
- [x] **IPRX-03**: In enforce-block mode, check-in and check-out are blocked with a clear error message when the employee's IP does not match any allowlist entry; remote workers (is_remote=true) bypass the check
- [x] **IPRX-04**: In log-only mode, check-in and check-out proceed but the employee sees a soft warning; the attendance record is flagged with ip_violation=true when the IP does not match
- [x] **IPRX-05**: When the allowlist is empty, IP restriction has no effect regardless of mode; the check-in/check-out frontend pre-checks the IP before opening the camera so employees know their status before taking a photo

### UI & UX Improvements (UIUX)

- [ ] **UIUX-01**: Employee Home page displays a live HH:MM:SS clock showing the current time in the device's local timezone
- [x] **UIUX-02**: All attendance status badges use a consistent Lucide icon per state (CheckCircle = On-time, Clock = Late, LogOut = Early Leave, AlertCircle = Missing Checkout, XCircle = Absent, Laptop = Remote)
- [x] **UIUX-03**: All new modals, tables, dropdowns, and form components use Shadcn UI components for visual consistency
- [ ] **UIUX-04**: Executive can click on any employee row in the dashboard to drill down to that employee's full attendance history (read-only)
- [ ] **UIUX-05**: Manager has a dedicated Employee Detail page showing one employee's full monthly attendance table with late/early reasons and acknowledgment status

## Deferred to v3

### Notifications

- **NOTF-01**: Admin/Manager receives daily or weekly email digest of late/absent employees
- **NOTF-02**: Manager receives real-time alert when employee is late or misses check-in

### Scheduling

- **SCHED-01**: Admin can assign different shifts to different days of the week for the same employee
- **SCHED-02**: Admin can create shift rotation patterns

### Correction Workflow

- **CORR-01**: Employee can submit an in-system correction request for a missing/incorrect record
- **CORR-02**: Admin can view and action a queue of correction requests

### Enhanced Security

- **ENHS-01**: Face recognition match at check-in (photo matched against registered employee face)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payroll calculation | Explicit boundary — not an attendance system responsibility |
| Face recognition | Significant complexity; photo-as-evidence achieves anti-fraud without AI |
| Native mobile app | Web-first; mobile browser supported but no native app |
| GPS / geolocation check-in | IP-based restriction sufficient |
| In-system correction request workflow | Admin adjusts directly with audit trail |
| Email / push notifications | Manual dashboard monitoring sufficient; deferred |
| Per-day/per-week shift scheduling | One active shift per employee; complex scheduling deferred |
| Scheduled auto-refresh CRON (12 PM / 11:30 PM) | Manual trigger is sufficient for v2.0; scheduled job deferred |
| Division-level timezone | Per-user timezone covers the use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 1 | Complete |
| ONBD-03 | Phase 1 | Complete |
| ONBD-04 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| SECU-01 | Phase 1 | Complete |
| SECU-02 | Phase 1 | Complete |
| USER-01 | Phase 2 | Complete |
| USER-02 | Phase 2 | Complete |
| USER-03 | Phase 2 | Complete |
| USER-04 | Phase 2 | Complete |
| USER-05 | Phase 2 | Complete |
| USER-06 | Phase 2 | Complete |
| SHFT-01 | Phase 2 | Complete |
| SHFT-02 | Phase 2 | Complete |
| SHFT-03 | Phase 2 | Complete |
| SHFT-04 | Phase 2 | Complete |
| ATTN-01 | Phase 3 | Complete |
| ATTN-02 | Phase 3 | Complete |
| ATTN-03 | Phase 3 | Complete |
| ATTN-04 | Phase 3 | Complete |
| ATTN-05 | Phase 3 | Complete |
| ATTN-06 | Phase 3 | Complete |
| ATTN-07 | Phase 3 | Complete |
| ATTN-08 | Phase 3 | Complete |
| ATTN-09 | Phase 3 | Complete |
| ATTN-10 | Phase 3 | Complete |
| ATTN-11 | Phase 3 | Complete |
| ATTN-12 | Phase 3 | Complete |
| ATTN-13 | Phase 3 | Complete |
| EVID-01 | Phase 3 | Complete |
| EVID-02 | Phase 3 | Complete |
| EVID-03 | Phase 3 | Complete |
| EVID-04 | Phase 3 | Complete |
| ADJT-01 | Phase 4 | Complete |
| ADJT-02 | Phase 4 | Complete |
| ADJT-03 | Phase 4 | Complete |
| MNGR-01 | Phase 5 Plan 05-01 | Done |
| MNGR-02 | Phase 5 Plan 05-01 | Done |
| MNGR-03 | Phase 5 Plan 05-01 | Done |
| MNGR-04 | Phase 5 Plan 05-01 | Done |
| MNGR-05 | Phase 5 Plan 05-01 | Done |
| MNGR-06 | Phase 5 Plan 05-01 | Done |
| EXEC-01 | Phase 5 Plan 05-02 | Done |
| EXEC-02 | Phase 5 Plan 05-02 | Done |
| EXEC-03 | Phase 5 Plan 05-02 | Done |
| EXEC-04 | Phase 5 Plan 05-02 | Done |
| EXEC-05 | Phase 5 Plan 05-02 | Done |
| RPTS-01 | Phase 5 Plan 05-02 | Done |
| RPTS-02 | Phase 5 Plan 05-02 | Done |
| RPTS-03 | Phase 5 Plan 05-02 | Done |
| DIVN-01 | Phase 6 Plan 06-04 | Done |
| DIVN-02 | Phase 6 Plan 06-04 | Done |
| DIVN-03 | Phase 6 Plan 06-04 | Done |
| DIVN-04 | Phase 6 Plan 06-04 | Done |
| DIVN-05 | Phase 6 | Pending |
| DIVN-06 | Phase 6 | Pending |
| DIVN-07 | Phase 6 | Pending |
| EMPL-01 | Phase 7 Plan 07-02 | Done |
| EMPL-02 | Phase 7 Plan 07-02 | Done |
| EMPL-03 | Phase 7 Plan 07-02 | Done |
| EMPL-04 | Phase 7 Plan 07-02 | Done |
| TZMG-01 | Phase 7 Plan 07-01 | Done |
| TZMG-02 | Phase 7 | Pending |
| RMOT-01 | Phase 8 | Complete |
| RMOT-02 | Phase 8 | Complete |
| ACKN-01 | Phase 8 | Complete |
| ACKN-02 | Phase 8 | Complete |
| ACKN-03 | Phase 8 | Complete |
| ACKN-04 | Phase 8 | Complete |
| ACKN-05 | Phase 8 | Complete |
| RFSH-01 | Phase 9 | Complete |
| RFSH-02 | Phase 9 | Complete |
| RFSH-03 | Phase 9 | Complete |
| RFSH-04 | Phase 9 | Complete |
| FLTR-01 | Phase 9 | Complete |
| FLTR-02 | Phase 9 | Complete |
| FLTR-03 | Phase 9 | Complete |
| FLTR-04 | Phase 9 | Complete |
| FLTR-05 | Phase 9 | Complete |
| PAGI-01 | Phase 10 | Complete |
| PAGI-02 | Phase 10 | Complete |
| PAGI-03 | Phase 10 | Complete |
| PAGI-04 | Phase 10 | Complete |
| IPRX-01 | Phase 11 | Complete |
| IPRX-02 | Phase 11 | Complete |
| IPRX-03 | Phase 11 | Complete |
| IPRX-04 | Phase 11 | Complete |
| IPRX-05 | Phase 11 | Complete |
| UIUX-01 | Phase 12 | Pending |
| UIUX-02 | Phase 12 | Complete |
| UIUX-03 | Phase 12 | Complete |
| UIUX-04 | Phase 12 | Pending |
| UIUX-05 | Phase 12 | Pending |

**v1 Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0 ✓

**v2 Coverage:**
- v2 requirements: 43 total (38 previous + 5 IPRX added 2026-03-06)
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-06 — IPRX-01–05 added for Phase 11 (IP Restriction); UIUX moved to Phase 12; 43 v2 requirements mapped across Phases 6–12*
