import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DataRefreshService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Runs the Data Refresh for a single company.
   * - Marks employees with no check-in today as 'absent_morning'
   * - Marks employees with no record at all for yesterday as 'absent'
   * - Updates companies.last_refresh_at
   * Returns counts of inserted records.
   */
  async runRefresh(companyId: string): Promise<{ absentMorningCount: number; absentCount: number; absentAfternoonCount: number; lastRefreshAt: string }> {
    const client = this.supabase.getClient();

    // 1. Fetch company timezone
    const { data: company, error: compErr } = await client
      .from('companies')
      .select('timezone')
      .eq('id', companyId)
      .single();

    if (compErr || !company) {
      throw new InternalServerErrorException('Failed to fetch company settings');
    }

    const timezone: string = (company as Record<string, unknown>).timezone as string ?? 'UTC';

    // 2. Compute today and yesterday in company timezone
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA', { timeZone: timezone });

    // 3. Fetch all active, non-deleted employees for this company
    const { data: employees, error: empErr } = await client
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (empErr) {
      throw new InternalServerErrorException(`Failed to fetch employees: ${empErr.message}`);
    }

    const allEmployeeIds = ((employees ?? []) as Record<string, unknown>[]).map((e) => e.id as string);

    if (allEmployeeIds.length === 0) {
      // No employees — just update last_refresh_at and return
      const now = new Date().toISOString();
      await client.from('companies').update({ last_refresh_at: now }).eq('id', companyId);
      return { absentMorningCount: 0, absentCount: 0, absentAfternoonCount: 0, lastRefreshAt: now };
    }

    // 4. Find employees who already have a record for today
    const { data: todayRecords, error: todayErr } = await client
      .from('attendance_records')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('work_date', todayStr)
      .in('user_id', allEmployeeIds);

    if (todayErr) {
      throw new InternalServerErrorException(`Failed to fetch today records: ${todayErr.message}`);
    }

    const hasRecordToday = new Set(
      ((todayRecords ?? []) as Record<string, unknown>[]).map((r) => r.user_id as string),
    );

    // Employees with no check-in today → absent_morning
    const absentMorningIds = allEmployeeIds.filter((id) => !hasRecordToday.has(id));

    // 5. Find employees who already have a record for yesterday
    const { data: yesterdayRecords, error: yesterdayErr } = await client
      .from('attendance_records')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('work_date', yesterdayStr)
      .in('user_id', allEmployeeIds);

    if (yesterdayErr) {
      throw new InternalServerErrorException(`Failed to fetch yesterday records: ${yesterdayErr.message}`);
    }

    const hasRecordYesterday = new Set(
      ((yesterdayRecords ?? []) as Record<string, unknown>[]).map((r) => r.user_id as string),
    );

    // Employees with no record at all yesterday → absent
    const absentIds = allEmployeeIds.filter((id) => !hasRecordYesterday.has(id));

    const now = new Date().toISOString();

    // 6. Insert absent_morning records (skip conflicts — idempotent)
    let absentMorningCount = 0;
    if (absentMorningIds.length > 0) {
      const rows = absentMorningIds.map((userId) => ({
        company_id: companyId,
        user_id: userId,
        work_date: todayStr,
        check_in_status: 'absent_morning',
        source: 'system',
        created_at: now,
        updated_at: now,
      }));

      const { data: inserted, error: insertErr } = await client
        .from('attendance_records')
        .upsert(rows, { onConflict: 'user_id,work_date', ignoreDuplicates: true })
        .select('id');

      if (insertErr) {
        throw new InternalServerErrorException(`Failed to insert absent_morning records: ${insertErr.message}`);
      }
      absentMorningCount = (inserted ?? []).length;
    }

    // 7. Insert absent records for yesterday (skip conflicts — idempotent)
    let absentCount = 0;
    if (absentIds.length > 0) {
      const rows = absentIds.map((userId) => ({
        company_id: companyId,
        user_id: userId,
        work_date: yesterdayStr,
        check_in_status: 'absent',
        source: 'system',
        created_at: now,
        updated_at: now,
      }));

      const { data: inserted, error: insertErr } = await client
        .from('attendance_records')
        .upsert(rows, { onConflict: 'user_id,work_date', ignoreDuplicates: true })
        .select('id');

      if (insertErr) {
        throw new InternalServerErrorException(`Failed to insert absent records: ${insertErr.message}`);
      }
      absentCount = (inserted ?? []).length;
    }

    // 7b. Mark yesterday's open records (checked in, no checkout) as absent_afternoon
    let absentAfternoonCount = 0;
    const { data: openRecords } = await client
      .from('attendance_records')
      .select('id')
      .eq('company_id', companyId)
      .eq('work_date', yesterdayStr)
      .not('check_in_at', 'is', null)
      .is('check_out_at', null);

    if ((openRecords ?? []).length > 0) {
      const openIds = (openRecords ?? []).map((r) => (r as Record<string, unknown>).id as string);
      const { data: updatedOpen, error: openErr } = await client
        .from('attendance_records')
        .update({ check_out_status: 'absent_afternoon', updated_at: now })
        .in('id', openIds)
        .select('id');

      if (openErr) {
        throw new InternalServerErrorException(`Failed to mark absent_afternoon records: ${openErr.message}`);
      }
      absentAfternoonCount = (updatedOpen ?? []).length;
    }

    // 8. Update companies.last_refresh_at
    const { error: refreshErr } = await client
      .from('companies')
      .update({ last_refresh_at: now })
      .eq('id', companyId);

    if (refreshErr) {
      throw new InternalServerErrorException(`Failed to update last_refresh_at: ${refreshErr.message}`);
    }

    return { absentMorningCount, absentCount, absentAfternoonCount, lastRefreshAt: now };
  }
}
