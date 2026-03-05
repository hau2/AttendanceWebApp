---
phase: 09-advanced-monitoring
verified: 2026-03-05T14:30:00Z
status: human_needed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "Apply DB migration 011 in Supabase SQL editor — run backend/src/database/migrations/011_data_refresh.sql"
    expected: "No errors; attendance_records check_in_status now accepts 'absent' and 'absent_morning'; companies.last_refresh_at column exists"
    why_human: "Supabase cloud SQL editor requires manual action; no CLI access"
  - test: "Log in as Admin, go to Attendance Records. Click 'Data Refresh' button."
    expected: "Button shows 'Refreshing...' during run. On completion, 'Last: [date/time]' appears below the button. Absent Morning rows appear for employees who had no check-in today. Absent rows appear for yesterday's fully absent employees."
    why_human: "Live database state required; absent row insertion depends on real employee/attendance data"
  - test: "Click 'Data Refresh' a second time within the same day."
    expected: "No duplicate absent rows created. Last refresh timestamp updates to new run time."
    why_human: "Idempotency (ignoreDuplicates) requires runtime verification against a real database"
  - test: "Log in as Manager. Navigate to Attendance Records."
    expected: "'Data Refresh' button is NOT visible. Status filter dropdown IS visible."
    why_human: "Role-based conditional rendering requires browser verification"
  - test: "Select each of the 5 status filter options in turn: Late, Early Leave, Absent, Absent Morning, Absent Afternoon."
    expected: "Only records matching the selected status appear in the table. Absent Afternoon shows records with a check-in time but no check-out."
    why_human: "Filter correctness depends on real attendance data in various states"
  - test: "Apply 'Late' filter AND type a name in the search box."
    expected: "Only records matching both Late status AND the name search appear."
    why_human: "Filter composition requires real data with multiple employees"
  - test: "Click 'Clear filters'."
    expected: "All records return. All 4 filter dimensions (name, division, manager, status) reset to empty."
    why_human: "Full UI state reset with live data"
---

# Phase 9: Advanced Monitoring Verification Report

**Phase Goal:** Deliver Data Refresh and advanced attendance status filters — manual refresh job that inserts absent/absent_morning records, last_refresh_at timestamp, and a 5-option status filter dropdown on the Admin Attendance page.
**Verified:** 2026-03-05T14:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All 14 must-have truths from plan frontmatter verified against actual codebase. Evidence is direct code inspection of committed files.

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Admin can POST /attendance/refresh and it inserts absent_morning rows for today's employees with no check-in | VERIFIED | `data-refresh.service.ts` lines 100–120: upsert with `check_in_status: 'absent_morning'` for `absentMorningIds` (employees without a today record) |
| 2  | Admin can POST /attendance/refresh and it inserts absent rows for yesterday's employees with no record at all | VERIFIED | `data-refresh.service.ts` lines 122–144: upsert with `check_in_status: 'absent'` for `absentIds` (employees without a yesterday record) |
| 3  | After refresh runs, companies.last_refresh_at is updated to the current timestamp | VERIFIED | `data-refresh.service.ts` lines 146–154: `client.from('companies').update({ last_refresh_at: now }).eq('id', companyId)` |
| 4  | GET /company/settings returns last_refresh_at so the frontend can display it | VERIFIED | `company.service.ts` line 13: `.select('id, name, timezone, ip_mode, ip_allowlist, onboarding_complete, last_refresh_at')` |
| 5  | Non-admin roles receive 403 when calling POST /attendance/refresh | VERIFIED | `attendance.controller.ts` lines 185–188: `if (!['admin', 'owner'].includes(role)) throw new ForbiddenException(...)` |
| 6  | Admin sees a 'Data Refresh' button on the Admin Attendance page | VERIFIED | `page.tsx` lines 196–212: `{['admin', 'owner'].includes(userRole) && <div>...<button>Data Refresh</button>...</div>}` |
| 7  | Clicking Data Refresh calls POST /attendance/refresh and shows a success/error toast | VERIFIED | `page.tsx` lines 74–88: `handleRefresh()` calls `triggerRefresh()`, sets `refreshError` on failure — no toast library, uses inline error text |
| 8  | After refresh runs, the page displays the last refresh timestamp | VERIFIED | `page.tsx` lines 205–208: `{lastRefreshAt && <span>Last: {new Date(lastRefreshAt).toLocaleString(...)}</span>}` |
| 9  | A status filter dropdown lets Admin/Manager filter by Late, Early Leave, Absent, Absent Morning, or Absent Afternoon | VERIFIED | `page.tsx` lines 256–267: `<select>` with 5 options; not role-gated (visible to all roles including Manager) |
| 10 | Selecting 'Late' shows only records with check_in_status === 'late' | VERIFIED | `page.tsx` line 135: `if (filterStatus === 'late' && r.check_in_status !== 'late') return false;` |
| 11 | Selecting 'Early Leave' shows only records with check_out_status === 'early' | VERIFIED | `page.tsx` line 136: `if (filterStatus === 'early' && r.check_out_status !== 'early') return false;` |
| 12 | Selecting 'Absent' shows only records with check_in_status === 'absent' | VERIFIED | `page.tsx` line 137: `if (filterStatus === 'absent' && r.check_in_status !== 'absent') return false;` |
| 13 | Selecting 'Absent Morning' shows only records with check_in_status === 'absent_morning' | VERIFIED | `page.tsx` line 138: `if (filterStatus === 'absent_morning' && r.check_in_status !== 'absent_morning') return false;` |
| 14 | Selecting 'Absent Afternoon' shows records where check_in_at is set and check_out_at is null | VERIFIED | `page.tsx` line 139: `if (filterStatus === 'absent_afternoon' && !(r.check_in_at !== null && r.check_out_at === null)) return false;` |

**Score: 14/14 truths verified**

---

### Required Artifacts

All 5 artifacts verified at all three levels (exists, substantive, wired).

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `backend/src/database/migrations/011_data_refresh.sql` | DB schema: extend check_in_status + add last_refresh_at | Yes | Yes (21 lines, DROP+ADD constraint, ADD COLUMN) | N/A (migration, not imported) | VERIFIED |
| `backend/src/attendance/data-refresh.service.ts` | DataRefreshService with runRefresh(companyId) | Yes | Yes (159 lines, full logic: TZ-aware dates, employee fetch, set-diff, upsert, timestamp update) | Injected in controller constructor; registered in module providers | VERIFIED |
| `backend/src/attendance/attendance.controller.ts` | POST /attendance/refresh route (admin/owner only) | Yes | Yes — route at lines 183–190 with role guard and service delegation | Wired via DataRefreshService injection | VERIFIED |
| `backend/src/company/company.service.ts` | getSettings() includes last_refresh_at | Yes | Yes — field added to select query at line 13 | Called by company controller (pre-existing wiring) | VERIFIED |
| `frontend/src/lib/api/attendance.ts` | triggerRefresh() + AbsentRecord types | Yes | Yes — RefreshResult interface + triggerRefresh() at lines 275–291; check_in_status union extended line 11 | Imported and called in page.tsx line 7 | VERIFIED |
| `frontend/src/lib/api/company.ts` | getCompanySettings() returns last_refresh_at | Yes | Yes — CompanySettings interface + getCompanySettings() at lines 13–29 | Imported and called in page.tsx line 8, used line 50 | VERIFIED |
| `frontend/src/app/(app)/admin/attendance/page.tsx` | Data Refresh button, last_refresh_at display, status filter dropdown | Yes | Yes — 313 lines, full UI with all three features | Wired to triggerRefresh() and getCompanySettings() | VERIFIED |
| `frontend/src/app/(app)/admin/attendance/components/AttendanceRecordTable.tsx` | statusBadge extended with absent/absent_morning | Yes | Yes — statusBadge map includes 'absent' (gray) and 'absent_morning' (purple) at lines 28–29 | Receives filteredRecords from page.tsx | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `attendance.controller.ts` | `data-refresh.service.ts` | DataRefreshService injection | WIRED | Constructor injects `DataRefreshService`; `runRefresh()` called at line 189 |
| `data-refresh.service.ts` | `attendance_records` | Supabase upsert with check_in_status='absent' or 'absent_morning' | WIRED | Lines 111–120 and 135–143: `.from('attendance_records').upsert(rows, ...)` with correct status values |
| `data-refresh.service.ts` | `companies` | UPDATE companies SET last_refresh_at | WIRED | Lines 147–150: `.from('companies').update({ last_refresh_at: now })` |
| `page.tsx` | POST /attendance/refresh | triggerRefresh() in attendance.ts | WIRED | `triggerRefresh` imported line 7; called in `handleRefresh()` line 78 |
| `page.tsx` | GET /company/settings | getCompanySettings() in company.ts | WIRED | `getCompanySettings` imported line 8; called line 50 with `setLastRefreshAt(s.last_refresh_at)` |
| `page.tsx` | filteredRecords | filterStatus state applied to records array | WIRED | `filterStatus` state line 35; applied in filter closure lines 134–140; `hasFilters` includes it line 144; cleared in onClick line 271 |
| `attendance.module.ts` | DataRefreshService | providers array | WIRED | Line 11: `providers: [AttendanceService, AttendanceCronService, DataRefreshService]` |

---

### Requirements Coverage

All 9 Phase 9 requirement IDs declared across plans (09-01 and 09-02) verified.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RFSH-01 | 09-01, 09-02 | Admin can manually trigger Data Refresh via button on Admin Attendance page | SATISFIED | POST /attendance/refresh route exists; Data Refresh button in page.tsx gated to admin/owner |
| RFSH-02 | 09-01 | Data Refresh marks employees with no check-in today as "Absent Morning" | SATISFIED | DataRefreshService lines 74–120: set-diff on today's records, upsert absent_morning rows |
| RFSH-03 | 09-01 | Data Refresh marks employees with no record yesterday as "Absent" | SATISFIED | DataRefreshService lines 77–144: set-diff on yesterday's records, upsert absent rows |
| RFSH-04 | 09-01, 09-02 | Admin can see date/time of last Data Refresh run | SATISFIED | last_refresh_at updated in service, returned in getSettings(), displayed in page.tsx lines 205–208 |
| FLTR-01 | 09-02 | Filter by "Late" — shows only late check-in records | SATISFIED | page.tsx line 135: `r.check_in_status !== 'late'` |
| FLTR-02 | 09-02 | Filter by "Early Leave" — shows only early checkout records | SATISFIED | page.tsx line 136: `r.check_out_status !== 'early'` |
| FLTR-03 | 09-02 | Filter by "Absent" — shows only absent records | SATISFIED | page.tsx line 137: `r.check_in_status !== 'absent'` |
| FLTR-04 | 09-02 | Filter by "Absent Morning" — shows only absent_morning records | SATISFIED | page.tsx line 138: `r.check_in_status !== 'absent_morning'` |
| FLTR-05 | 09-02 | Filter by "Absent Afternoon" — shows records with check-in but no check-out | SATISFIED | page.tsx line 139: `!(r.check_in_at !== null && r.check_out_at === null)` |

No orphaned requirements: every requirement mapped to Phase 9 in REQUIREMENTS.md (lines 270–278) is accounted for in the plans and verified in code.

---

### Anti-Patterns Found

No blockers or warnings detected.

Files scanned: `data-refresh.service.ts`, `attendance.controller.ts`, `attendance.module.ts`, `company.service.ts`, `attendance.ts`, `company.ts`, `page.tsx`, `AttendanceRecordTable.tsx`, `011_data_refresh.sql`

| File | Pattern | Severity | Result |
|------|---------|----------|--------|
| All modified files | TODO/FIXME/PLACEHOLDER | Checked | None found |
| All modified files | `return null` / `return {}` stubs | Checked | None found |
| `data-refresh.service.ts` | Empty no-op implementations | Checked | All branches return meaningful values or throw |
| `page.tsx` | `onClick={() => {}}` empty handlers | Checked | handleRefresh is fully implemented |

Note: The "toast" for refresh errors is implemented as inline error text (`refreshError` state rendered as `text-xs text-red-500`), not a toast notification. This differs slightly from plan language ("shows a success/error toast") but is functionally equivalent and not a blocker.

---

### Human Verification Required

The automated code-level checks all pass. The following items require a running application to confirm:

#### 1. DB Migration Applied

**Test:** Open Supabase SQL editor. Run `backend/src/database/migrations/011_data_refresh.sql`. Confirm no errors.
**Expected:** check_in_status constraint extended to accept 'absent' and 'absent_morning'; companies.last_refresh_at TIMESTAMPTZ column exists.
**Why human:** No CLI access to Supabase cloud SQL editor; migration is not auto-applied.

#### 2. Data Refresh End-to-End

**Test:** Log in as Admin, go to Admin > Attendance Records. Click "Data Refresh" button.
**Expected:** Button shows "Refreshing..." while running. After completion: "Last: [date/time]" appears below button. Absent Morning rows appear for employees with no check-in today. Absent rows appear for employees with no record yesterday.
**Why human:** Requires live database state with real employee data in various attendance states.

#### 3. Idempotency Check

**Test:** Click "Data Refresh" a second time on the same day.
**Expected:** No duplicate absent rows created. Last refresh timestamp updates to the new run time.
**Why human:** Upsert idempotency (ignoreDuplicates) requires runtime verification against real data.

#### 4. Manager Role Visibility

**Test:** Log in as Manager, go to Attendance Records.
**Expected:** "Data Refresh" button is NOT visible. Status filter dropdown IS visible.
**Why human:** Role-based conditional rendering requires browser verification with a Manager-role session.

#### 5. All 5 Status Filters

**Test:** Select each filter option in turn: Late, Early Leave, Absent, Absent Morning, Absent Afternoon.
**Expected:** Only records matching the selected status appear. Absent Afternoon correctly shows records with check_in_at set and check_out_at null (not missing_checkout-flagged records, which have a different display).
**Why human:** Filter accuracy depends on real attendance data in multiple states.

#### 6. Filter Composition and Clear Filters

**Test:** Apply "Late" filter, then type a name in the search box. Then click "Clear filters".
**Expected:** Only records matching both Late AND the name search appear while both active. After Clear filters: all records return, all 4 filter dimensions reset.
**Why human:** Requires real data with multiple employees across multiple states.

---

### Summary

Phase 9 feature delivery is complete at the code level. All 9 requirements (RFSH-01 through RFSH-04, FLTR-01 through FLTR-05) have verified code implementations across 8 modified/created files in 4 commits. No stubs, no orphaned artifacts, no anti-patterns. The only remaining work is:

1. **DB migration 011 must be applied in Supabase** before the Data Refresh endpoint will function (check_in_status constraint must accept the new values).
2. **Human E2E sign-off** on runtime behavior (absent rows appear, idempotency, role visibility, filter correctness).

The 09-03-SUMMARY.md indicates the human verified all scenarios on 2026-03-05 and approved. If that sign-off is accepted, the phase is fully complete pending no regressions.

---

_Verified: 2026-03-05T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
