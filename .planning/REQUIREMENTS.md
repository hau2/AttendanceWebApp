# Requirements: Attendance SaaS

**Defined:** 2026-03-01
**Core Value:** Employees can check in/out quickly with photo evidence — while managers and admins have real-time, accurate attendance data — deployed by any company in minutes with no IT support needed.

## v1 Requirements

Requirements for initial release. Each maps to a roadmap phase.

### Onboarding (ONBD)

- [ ] **ONBD-01**: Owner can register a new company (name, email, password) — system creates isolated tenant automatically
- [ ] **ONBD-02**: Owner is guided through setup wizard after registration (timezone → shift → first users)
- [ ] **ONBD-03**: Owner/Admin can configure company timezone (required before any attendance tracking begins)
- [ ] **ONBD-04**: Owner/Admin can configure IP restriction mode per company: log-only or enforce-block

### Authentication (AUTH)

- [ ] **AUTH-01**: User can log in with email and password
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can log out from any page

### User Management (USER)

- [ ] **USER-01**: Admin can create users with assigned roles (Owner, Admin, Manager, Employee, Executive)
- [ ] **USER-02**: Admin can change a user's role
- [ ] **USER-03**: Admin can disable or enable a user account
- [ ] **USER-04**: Admin can import employees via CSV
- [ ] **USER-05**: Admin can assign a Manager to oversee specific employees
- [ ] **USER-06**: Disabled users cannot log in or perform attendance actions

### Shift Management (SHFT)

- [ ] **SHFT-01**: Admin can create work shifts (start time, end time, grace period in minutes)
- [ ] **SHFT-02**: Admin can edit existing shifts
- [ ] **SHFT-03**: Admin can assign a shift to an employee with an effective date
- [ ] **SHFT-04**: Each employee has exactly one active shift at any given time

### Attendance (ATTN)

- [ ] **ATTN-01**: Employee sees a prominent CHECK-IN button on their home page
- [ ] **ATTN-02**: Check-in captures timestamp, photo (camera only), IP address, and late classification
- [ ] **ATTN-03**: System classifies check-in as on-time, within-grace, or late — with minutes late recorded
- [ ] **ATTN-04**: Employee must enter a reason if checking in late
- [ ] **ATTN-05**: Check-out captures timestamp, photo, and IP address
- [ ] **ATTN-06**: System classifies checkout as on-time or early — with minutes early recorded
- [ ] **ATTN-07**: Employee must enter a note if checking out early
- [ ] **ATTN-08**: System auto-marks record as "missing checkout" after midnight (company timezone) if no checkout occurred
- [ ] **ATTN-09**: System enforces exactly one attendance record per employee per work_date
- [ ] **ATTN-10**: Employee can view their own attendance history by month
- [ ] **ATTN-11**: System records whether each check-in/check-out IP is within the company's IP allowlist
- [ ] **ATTN-12**: When IP policy is enforce-block, check-in/out attempts from outside the allowlist are rejected with a clear user message
- [ ] **ATTN-13**: System prevents duplicate check-in or check-out submissions for the same work_date (idempotent behavior)

### Evidence / Photos (EVID)

- [ ] **EVID-01**: Attendance photos are stored per record and visible to Admin and Manager in record detail
- [ ] **EVID-02**: Photo capture uses device camera only — file upload is not permitted
- [ ] **EVID-03**: Photos are retained for 90–180 days per record
- [ ] **EVID-04**: Employee can view their own attendance photos but cannot access photos of other employees

### Admin Adjustments (ADJT)

- [ ] **ADJT-01**: Admin can edit check-in or check-out times on any attendance record
- [ ] **ADJT-02**: Admin must provide a reason when editing an attendance record
- [ ] **ADJT-03**: System stores full audit trail per edit: who changed, when, before/after values — original data never deleted

### Manager Monitoring (MNGR)

- [ ] **MNGR-01**: Manager can only view employees assigned to them
- [ ] **MNGR-02**: Manager can view attendance records by day or by month
- [ ] **MNGR-03**: Manager can filter records by individual employee
- [ ] **MNGR-04**: Manager can read employee notes (late reasons, early-leave explanations)
- [ ] **MNGR-05**: Manager can view photos embedded in attendance records
- [ ] **MNGR-06**: Manager can view team report: total late count, punctuality rate, monthly trend

### Executive Dashboard (EXEC)

- [ ] **EXEC-01**: Executive can view company-wide attendance rate
- [ ] **EXEC-02**: Executive can view employees ranked by late frequency
- [ ] **EXEC-03**: Executive can view monthly aggregated attendance summaries
- [ ] **EXEC-04**: Executive can drill down to individual employee attendance history
- [ ] **EXEC-05**: Executive has read-only access — no editing

### Reports & Export (RPTS)

- [ ] **RPTS-01**: Admin and Manager can generate monthly attendance reports
- [ ] **RPTS-02**: Admin and Manager can view late statistics
- [ ] **RPTS-03**: Admin and Manager can export attendance data to CSV

### Security (SECU)

- [ ] **SECU-01**: Each company's data is fully isolated — no cross-tenant access possible
- [ ] **SECU-02**: All database queries scoped by company_id via Supabase Row Level Security

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

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
| Payroll calculation | Explicit v1 boundary — not an attendance system responsibility |
| Face recognition | Significant complexity and cost; photo-as-evidence achieves anti-fraud goal without AI |
| Native mobile app | Web-first; mobile browser supported but no native app in v1 |
| GPS / geolocation check-in | IP-based restriction is sufficient for v1 |
| In-system correction request workflow | Admin adjusts directly with audit trail; offline notification sufficient for v1 |
| Email / push notifications | Manual dashboard monitoring sufficient; deferred to v2 |
| Per-day/per-week shift scheduling | One active shift per employee; complex scheduling deferred pending real demand |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBD-01 | Phase 1 | Pending |
| ONBD-02 | Phase 1 | Pending |
| ONBD-03 | Phase 1 | Pending |
| ONBD-04 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| SECU-01 | Phase 1 | Pending |
| SECU-02 | Phase 1 | Pending |
| USER-01 | Phase 2 | Pending |
| USER-02 | Phase 2 | Pending |
| USER-03 | Phase 2 | Pending |
| USER-04 | Phase 2 | Pending |
| USER-05 | Phase 2 | Pending |
| USER-06 | Phase 2 | Pending |
| SHFT-01 | Phase 2 | Pending |
| SHFT-02 | Phase 2 | Pending |
| SHFT-03 | Phase 2 | Pending |
| SHFT-04 | Phase 2 | Pending |
| ATTN-01 | Phase 3 | Pending |
| ATTN-02 | Phase 3 | Pending |
| ATTN-03 | Phase 3 | Pending |
| ATTN-04 | Phase 3 | Pending |
| ATTN-05 | Phase 3 | Pending |
| ATTN-06 | Phase 3 | Pending |
| ATTN-07 | Phase 3 | Pending |
| ATTN-08 | Phase 3 | Pending |
| ATTN-09 | Phase 3 | Pending |
| ATTN-10 | Phase 3 | Pending |
| ATTN-11 | Phase 3 | Pending |
| ATTN-12 | Phase 3 | Pending |
| ATTN-13 | Phase 3 | Pending |
| EVID-01 | Phase 3 | Pending |
| EVID-02 | Phase 3 | Pending |
| EVID-03 | Phase 3 | Pending |
| EVID-04 | Phase 3 | Pending |
| ADJT-01 | Phase 4 | Pending |
| ADJT-02 | Phase 4 | Pending |
| ADJT-03 | Phase 4 | Pending |
| MNGR-01 | Phase 5 | Pending |
| MNGR-02 | Phase 5 | Pending |
| MNGR-03 | Phase 5 | Pending |
| MNGR-04 | Phase 5 | Pending |
| MNGR-05 | Phase 5 | Pending |
| MNGR-06 | Phase 5 | Pending |
| EXEC-01 | Phase 5 | Pending |
| EXEC-02 | Phase 5 | Pending |
| EXEC-03 | Phase 5 | Pending |
| EXEC-04 | Phase 5 | Pending |
| EXEC-05 | Phase 5 | Pending |
| RPTS-01 | Phase 5 | Pending |
| RPTS-02 | Phase 5 | Pending |
| RPTS-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
