---
phase: 11-ip-restriction
plan: "01"
subsystem: backend
tags: [ip-restriction, cidr, attendance, company-settings, migration]
dependency_graph:
  requires: []
  provides:
    - "013_ip_restriction.sql migration"
    - "cidrContains() and ipInAllowlist() utility functions"
    - "POST /company/ip-allowlist"
    - "DELETE /company/ip-allowlist/:index"
    - "GET /attendance/ip-check"
    - "IP enforcement in checkIn/checkOut with disabled mode, is_remote bypass, CIDR matching"
  affects:
    - backend/src/attendance/attendance.service.ts
    - backend/src/company/company.service.ts
    - backend/src/company/company.controller.ts
tech_stack:
  added: []
  patterns:
    - "CIDR bitwise matching without external library"
    - "resolveIpRestriction() helper pattern for shared IP logic"
    - "JSONB allowlist with {cidr, label} objects"
key_files:
  created:
    - backend/src/database/migrations/013_ip_restriction.sql
    - backend/src/common/ip-restriction.util.ts
    - backend/src/company/dto/add-ip-entry.dto.ts
  modified:
    - backend/src/company/dto/update-company-settings.dto.ts
    - backend/src/company/company.service.ts
    - backend/src/company/company.controller.ts
    - backend/src/attendance/attendance.service.ts
    - backend/src/attendance/attendance.controller.ts
decisions:
  - "resolveIpRestriction() private helper centralises all IP logic — disabled mode, empty allowlist, is_remote bypass, CIDR matching, enforce-block, log-only violation — replaces two identical inline blocks"
  - "ip_violation column on attendance_records marks both check-in and check-out violations in log-only mode"
  - "ipAllowlist removed from UpdateCompanySettingsDto — dedicated POST/DELETE endpoints manage entries atomically"
  - "checkOut uses isRemote=false — check-out has no is_remote flag"
  - "Empty allowlist = no restriction (pass-through) — consistent with existing design decision"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-06"
  tasks_completed: 3
  files_changed: 8
requirements:
  - IPRX-01
  - IPRX-02
  - IPRX-03
  - IPRX-04
  - IPRX-05
---

# Phase 11 Plan 01: IP Restriction Backend Infrastructure Summary

**One-liner:** CIDR-aware IP enforcement backend with JSONB allowlist, disabled mode, is_remote bypass, and violation flagging via a shared resolveIpRestriction() helper.

## What Was Built

All backend infrastructure for Phase 11 IP Restriction:

1. **SQL Migration 013** (`013_ip_restriction.sql`) — three ALTER TABLE operations:
   - Extends `companies.ip_mode` CHECK constraint to include `'disabled'`
   - Adds `attendance_records.ip_violation BOOLEAN NOT NULL DEFAULT FALSE`
   - Converts `companies.ip_allowlist` from `TEXT[]` to `JSONB` (array of `{cidr, label?}` objects)

2. **CIDR Utility** (`ip-restriction.util.ts`) — pure TypeScript, no external libraries:
   - `cidrContains(cidr, ip)` — bitwise IPv4 CIDR matching; handles exact IPs and CIDR ranges
   - `ipInAllowlist(allowlist, ip)` — empty allowlist returns `true` (no restriction)

3. **Company Allowlist CRUD** — dedicated endpoints replacing the old bulk-update approach:
   - `POST /company/ip-allowlist` — appends `{cidr, label?}` to JSONB array (admin/owner only)
   - `DELETE /company/ip-allowlist/:index` — removes entry by index (admin/owner only)
   - `UpdateCompanySettingsDto` updated: adds `'disabled'` mode, removes `ipAllowlist` field

4. **Attendance IP Enforcement Overhaul**:
   - `resolveIpRestriction()` private helper implements: disabled mode short-circuit, empty allowlist pass-through, `is_remote=true` bypass, CIDR-aware matching, enforce-block, log-only violation flag
   - `checkIn()` calls helper; includes `ip_violation` in upsert
   - `checkOut()` calls helper with `isRemote=false`; includes `ip_violation` in update
   - `GET /attendance/ip-check` — new endpoint returning `{ip, withinAllowlist, ipMode}`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 92b085c | feat(11-01): add SQL migration 013 and CIDR utility |
| 2 | 257d9e1 | feat(11-01): add company IP allowlist CRUD endpoints and DTO updates |
| 3 | 26e2d25 | feat(11-01): overhaul attendance IP enforcement with CIDR, disabled mode, is_remote bypass |

## Deviations from Plan

None — plan executed exactly as written.

The `ip_violation` flag was also added to the post-shift checkout path within `checkIn()` (the early-morning absent_morning branch), which was implied by the plan but not explicitly called out. This ensures consistent ip_violation tracking across all attendance write paths.

## Success Criteria Verification

1. `013_ip_restriction.sql` — extends ip_mode, adds ip_violation, converts ip_allowlist to JSONB
2. `cidrContains('192.168.1.0/24', '192.168.1.50')` → `true`; `cidrContains('192.168.1.0/24', '10.0.0.1')` → `false`
3. `ipInAllowlist([], anyIp)` → `true` (empty allowlist = no restriction)
4. `POST /company/ip-allowlist` accepts `{cidr, label?}` and appends to JSONB array
5. `DELETE /company/ip-allowlist/:index` removes entry at position
6. `GET /attendance/ip-check` returns `{ip, withinAllowlist, ipMode}`
7. `checkIn` with `is_remote: true` bypasses enforce-block (resolveIpRestriction returns `blocked: false`)
8. `checkIn` with `is_remote: false` and non-matching IP in log-only sets `ip_violation: true` and succeeds
9. TypeScript compiles with zero errors

## Self-Check: PASSED

All 8 files confirmed present on disk. All 3 commits confirmed in git log.
