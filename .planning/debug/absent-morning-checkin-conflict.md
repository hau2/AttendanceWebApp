---
status: awaiting_human_verify
trigger: "After running Data Refresh job (inserts absent_morning records), employees cannot check in — get 'Already checked in today' 409 Conflict error even though they never actually checked in."
created: 2026-03-05T00:00:00Z
updated: 2026-03-05T00:00:01Z
---

## Current Focus

hypothesis: checkIn() guard at line 219-234 of attendance.service.ts queries attendance_records for ANY record with (user_id, work_date) — it does NOT filter by status. The absent_morning record inserted by DataRefreshService satisfies this query and trips the ConflictException before the real check-in can proceed.
test: Confirmed by reading the code directly. The guard uses .maybeSingle() with no status filter, so it returns the synthetic absent_morning row.
expecting: Fix must skip absent_morning (and absent) rows in the idempotency guard, OR delete/upsert the synthetic row during real check-in.
next_action: Await human verification that employee can check in after refresh job runs.

## Symptoms

expected: Employee with absent_morning status (inserted by refresh job) should be able to check in normally — the absent_morning record is a synthetic placeholder, not a real check-in
actual: Employee gets 409 "Already checked in today" when attempting to check in
errors: {"message":"Already checked in today","error":"Conflict","statusCode":409}
reproduction: 1) Admin runs Data Refresh job → absent_morning records inserted for employees with no check-in today. 2) Employee (manager or any account) tries to check in. 3) Gets 409 conflict.
timeline: Introduced in Phase 9 when DataRefreshService was added (migration 011 + data-refresh.service.ts)

## Eliminated

(none — root cause confirmed on first read)

## Evidence

- timestamp: 2026-03-05T00:00:00Z
  checked: attendance.service.ts checkIn() — idempotency guard (lines 219-234)
  found: |
    const { data: existing, error: existingError } = await client
      .from('attendance_records')
      .select('id')
      .eq('user_id', userId)
      .eq('work_date', workDate)
      .maybeSingle();
    if (existing) {
      throw new ConflictException('Already checked in today');
    }
  implication: Guard matches ANY row for (user_id, work_date). DataRefreshService inserts absent_morning rows with source='system' and no check_in_at. This row satisfies the query and blocks real check-in.

- timestamp: 2026-03-05T00:00:00Z
  checked: data-refresh.service.ts — absent_morning insert (lines 100-120)
  found: Rows inserted with check_in_status='absent_morning', source='system', check_in_at=undefined (column omitted — will be NULL in DB). The upsert uses onConflict='user_id,work_date'.
  implication: The synthetic row occupies the unique (user_id, work_date) slot. The check-in guard hits it first.

- timestamp: 2026-03-05T00:00:00Z
  checked: migration 011 — unique constraint
  found: Migration does not add a new unique constraint. The unique constraint on (user_id, work_date) must already exist from an earlier migration.
  implication: Only one row per (user_id, work_date) is allowed. DataRefreshService uses upsert with ignoreDuplicates=true, which is safe. The real check-in INSERT would also conflict on this constraint if the guard didn't fire first.

## Resolution

root_cause: |
  The checkIn() idempotency guard in attendance.service.ts (lines 219-234) queries for ANY attendance_records row matching (user_id, work_date) without filtering out synthetic absent/absent_morning records inserted by DataRefreshService. When the refresh job runs before an employee checks in, the synthetic placeholder row trips the ConflictException and the employee cannot check in.

fix: |
  Two-part fix:
  1. In the checkIn() idempotency guard, add a NOT IN filter to exclude synthetic statuses:
     .not('check_in_status', 'in', '("absent","absent_morning")')
     — OR better: only block if the existing row has a real check_in_at timestamp.
  2. During the actual INSERT, change it to an upsert that replaces the synthetic row
     (onConflict='user_id,work_date'), so if the user has an absent_morning record it
     gets overwritten with the real check-in data.

  The cleanest fix: change the guard to filter for rows where check_in_at IS NOT NULL
  (real check-ins only). Then change the INSERT to an upsert with onConflict to handle
  the synthetic-row replacement atomically without a separate DELETE.

verification: |
  Self-verified by code inspection:
  1. Idempotency guard now adds .not('check_in_at', 'is', null) — absent_morning rows
     (check_in_at = NULL) are invisible to the guard. Real check-ins (check_in_at set)
     still block duplicates correctly.
  2. INSERT changed to upsert with onConflict='user_id,work_date', ignoreDuplicates=false.
     When a synthetic row exists, it is atomically overwritten. When no synthetic row
     exists, a new row is created. Both paths produce the correct real check-in record.
  Awaiting human confirmation in real environment.
files_changed:
  - backend/src/attendance/attendance.service.ts (lines 218-283)
