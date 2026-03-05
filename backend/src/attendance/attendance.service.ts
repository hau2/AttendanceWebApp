import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ShiftAssignmentsService, ShiftAssignmentWithShift } from '../shifts/shift-assignments.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AdjustRecordDto } from './dto/adjust-record.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ipInAllowlist } from '../common/ip-restriction.util';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly shiftAssignmentsService: ShiftAssignmentsService,
  ) {}

  /**
   * Returns today's date string (YYYY-MM-DD) in the company's timezone.
   * Uses Intl locale trick: 'en-CA' produces YYYY-MM-DD natively.
   */
  private getWorkDate(timezone: string): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  }

  /**
   * Convert a Date to minutes since midnight in the given timezone.
   * e.g. 08:30 -> 510
   */
  private getMinutesInTimezone(date: Date, timezone: string): number {
    // Use en-GB locale which always produces HH:MM in 24-hour h23 format (00-23).
    // Avoid en-US with hour12:false — it uses h24 cycle in Node.js/V8 and returns
    // "24:xx" for times just after midnight, causing midnight check-ins to appear
    // as 1440+ minutes and be misclassified as late.
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Parse shift time string "HH:MM" into minutes since midnight.
   */
  private parseShiftTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Classify check-in as 'on-time', 'within-grace', 'late', or 'absent_morning'.
   * Returns status and minutes_late.
   */
  private classifyCheckIn(
    checkInAt: Date,
    shift: ShiftAssignmentWithShift,
    timezone: string,
  ): { status: 'on-time' | 'within-grace' | 'late' | 'absent_morning'; minutesLate: number } {
    const checkInMinutes = this.getMinutesInTimezone(checkInAt, timezone);

    // Check afternoon_start_time: check-in at or after this time = missed morning
    if (shift.shifts.afternoon_start_time) {
      const afternoonStartMinutes = this.parseShiftTimeToMinutes(shift.shifts.afternoon_start_time);
      if (checkInMinutes >= afternoonStartMinutes) {
        return {
          status: 'absent_morning',
          minutesLate: Math.max(0, checkInMinutes - afternoonStartMinutes),
        };
      }
    }

    const shiftStartMinutes = this.parseShiftTimeToMinutes(shift.shifts.start_time);
    const gracePeriod = shift.shifts.grace_period_minutes;

    if (checkInMinutes <= shiftStartMinutes) {
      return { status: 'on-time', minutesLate: 0 };
    } else if (checkInMinutes <= shiftStartMinutes + gracePeriod) {
      return {
        status: 'within-grace',
        minutesLate: Math.max(0, checkInMinutes - shiftStartMinutes),
      };
    } else {
      return {
        status: 'late',
        minutesLate: checkInMinutes - shiftStartMinutes,
      };
    }
  }

  /**
   * Classify check-out as 'on-time', 'early', or 'absent_afternoon'.
   * Returns status and minutes_early.
   */
  private classifyCheckOut(
    checkOutAt: Date,
    shift: ShiftAssignmentWithShift,
    timezone: string,
  ): { status: 'on-time' | 'early' | 'absent_afternoon'; minutesEarly: number } {
    const checkOutMinutes = this.getMinutesInTimezone(checkOutAt, timezone);

    // Check morning_end_time: check-out at or before this time = missed afternoon
    if (shift.shifts.morning_end_time) {
      const morningEndMinutes = this.parseShiftTimeToMinutes(shift.shifts.morning_end_time);
      if (checkOutMinutes <= morningEndMinutes) {
        return { status: 'absent_afternoon', minutesEarly: 0 };
      }
    }

    const shiftEndMinutes = this.parseShiftTimeToMinutes(shift.shifts.end_time);

    if (checkOutMinutes >= shiftEndMinutes) {
      return { status: 'on-time', minutesEarly: 0 };
    } else {
      return {
        status: 'early',
        minutesEarly: shiftEndMinutes - checkOutMinutes,
      };
    }
  }

  /**
   * Fetch company timezone and IP settings in one query.
   */
  private async getCompanySettings(
    companyId: string,
  ): Promise<{ timezone: string; ipMode: 'disabled' | 'log-only' | 'enforce-block'; ipAllowlist: Array<{ cidr: string; label?: string }> }> {
    const client = this.supabase.getClient();
    const { data: company, error } = await client
      .from('companies')
      .select('timezone, ip_mode, ip_allowlist')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      throw new InternalServerErrorException('Failed to fetch company settings');
    }

    return {
      timezone: company.timezone ?? 'Asia/Ho_Chi_Minh',
      ipMode: (company.ip_mode ?? 'log-only') as 'disabled' | 'log-only' | 'enforce-block',
      ipAllowlist: (company.ip_allowlist as Array<{ cidr: string; label?: string }>) ?? [],
    };
  }

  /**
   * Resolve IP restriction for a check-in/check-out request.
   * Handles disabled mode, empty allowlist, is_remote bypass, CIDR matching,
   * enforce-block blocking, and log-only violation flagging.
   */
  private async resolveIpRestriction(params: {
    companyId: string;
    ip: string;
    isRemote: boolean;
  }): Promise<{ blocked: boolean; violation: boolean; withinAllowlist: boolean }> {
    const { companyId, ip, isRemote } = params;
    const client = this.supabase.getClient();
    const { data: company, error } = await client
      .from('companies')
      .select('ip_mode, ip_allowlist')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      throw new InternalServerErrorException('Failed to fetch company settings');
    }

    const ipMode = (company.ip_mode ?? 'log-only') as 'disabled' | 'log-only' | 'enforce-block';
    const allowlist = (company.ip_allowlist as Array<{ cidr: string; label?: string }>) ?? [];

    // Disabled mode or empty allowlist: no restriction
    if (ipMode === 'disabled' || allowlist.length === 0) {
      return { blocked: false, violation: false, withinAllowlist: true };
    }

    const withinAllowlist = ipInAllowlist(allowlist, ip);

    // Remote bypass: is_remote=true always passes through (but still compute withinAllowlist)
    if (isRemote) {
      return { blocked: false, violation: false, withinAllowlist };
    }

    // enforce-block: non-matching IP is blocked
    if (ipMode === 'enforce-block' && !withinAllowlist) {
      return { blocked: true, violation: false, withinAllowlist: false };
    }

    // log-only: non-matching IP sets violation flag but does not block
    if (ipMode === 'log-only' && !withinAllowlist) {
      return { blocked: false, violation: true, withinAllowlist: false };
    }

    return { blocked: false, violation: false, withinAllowlist: true };
  }

  /**
   * Return IP check result for the authenticated user's company.
   * Used by frontend to pre-check IP status before check-in/check-out.
   */
  async getIpCheckResult(companyId: string, ip: string): Promise<{ ip: string; withinAllowlist: boolean; ipMode: string }> {
    const { ipMode, ipAllowlist } = await this.getCompanySettings(companyId);
    const withinAllowlist = ipInAllowlist(ipAllowlist, ip);
    return { ip, withinAllowlist, ipMode };
  }

  /**
   * Check-in: create attendance record for today.
   * Enforces IP restrictions, idempotency, shift classification, and late reason requirement.
   */
  async checkIn(
    companyId: string,
    userId: string,
    ip: string,
    dto: CheckInDto,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // 1. Fetch company settings (timezone only; IP check uses resolveIpRestriction)
    const { timezone } = await this.getCompanySettings(companyId);

    // 1b. Fetch user's personal timezone override
    const { data: userRecord, error: userError } = await client
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (userError) {
      throw new InternalServerErrorException(`Failed to fetch user timezone: ${userError.message}`);
    }

    // Apply override: user timezone takes priority; fallback to company timezone
    const effectiveTimezone: string = (userRecord?.timezone as string | null) ?? timezone;

    // 2. IP check (CIDR-aware, with disabled mode and is_remote bypass)
    const { blocked, violation, withinAllowlist } = await this.resolveIpRestriction({
      companyId,
      ip,
      isRemote: dto.is_remote ?? false,
    });

    if (blocked) {
      throw new ForbiddenException(
        "Check-in blocked: your IP address is not in the company allowlist",
      );
    }

    // 3. Get work date in effective timezone
    const workDate = this.getWorkDate(effectiveTimezone);

    // 4. Check for existing REAL check-in record (idempotency guard).
    // Synthetic absent/absent_morning rows inserted by DataRefreshService have
    // check_in_at = NULL — they are placeholders, not real check-ins.
    // We only block if a row with an actual check_in_at timestamp already exists.
    const { data: existing, error: existingError } = await client
      .from('attendance_records')
      .select('id')
      .eq('user_id', userId)
      .eq('work_date', workDate)
      .not('check_in_at', 'is', null)
      .maybeSingle();

    if (existingError) {
      throw new InternalServerErrorException(
        `Failed to check existing record: ${existingError.message}`,
      );
    }

    if (existing) {
      throw new ConflictException('Already checked in today');
    }

    // 5. Get active shift (null = no shift = cannot classify)
    const now = new Date();
    const shift = await this.shiftAssignmentsService.getActiveShift(companyId, userId);

    // 5b. Post-shift guard: if current time > shift end, treat as checkout on absent_morning
    if (shift) {
      const nowMinutes = this.getMinutesInTimezone(now, effectiveTimezone);
      const shiftEndMinutes = this.parseShiftTimeToMinutes(shift.shifts.end_time);
      if (nowMinutes > shiftEndMinutes) {
        // Look for absent_morning placeholder (check_in_at IS NULL)
        const { data: absentRow } = await client
          .from('attendance_records')
          .select('id')
          .eq('user_id', userId)
          .eq('work_date', workDate)
          .is('check_in_at', null)
          .maybeSingle();

        if (absentRow) {
          // Perform checkout: update absent_morning record with check_out_at
          const { data: updated, error: updateErr } = await client
            .from('attendance_records')
            .update({
              check_out_at: now.toISOString(),
              check_out_photo_url: dto.photo_url ?? null,
              check_out_ip: ip,
              check_out_ip_within_allowlist: withinAllowlist,
              ip_violation: violation,
              source: 'employee',
              updated_at: now.toISOString(),
            })
            .eq('id', absentRow.id)
            .select()
            .single();
          if (updateErr || !updated) throw new InternalServerErrorException('Failed to record post-shift checkout');
          return updated as Record<string, unknown>;
        }
        throw new BadRequestException('Shift has ended');
      }
    }

    // 6. Classify check-in
    let checkInStatus: 'on-time' | 'within-grace' | 'late' | 'absent_morning' = 'on-time';
    let minutesLate = 0;

    if (shift) {
      const classification = this.classifyCheckIn(now, shift, effectiveTimezone);
      checkInStatus = classification.status;
      minutesLate = classification.minutesLate;
    }

    // 7. Require late_reason if late (including late arrival to afternoon session)
    if ((checkInStatus === 'late' || (checkInStatus === 'absent_morning' && minutesLate > 0)) && !dto.late_reason) {
      throw new BadRequestException('Late check-in requires a reason');
    }

    // 8. Upsert attendance record.
    // Using upsert (onConflict: 'user_id,work_date') so that if a synthetic
    // absent_morning placeholder exists for today it is atomically replaced by
    // the real check-in data. ignoreDuplicates: false ensures the row IS updated.
    const { data, error } = await client
      .from('attendance_records')
      .upsert(
        {
          company_id: companyId,
          user_id: userId,
          work_date: workDate,
          check_in_at: now.toISOString(),
          check_in_photo_url: dto.photo_url ?? null,
          check_in_ip: ip,
          check_in_status: checkInStatus,
          minutes_late: minutesLate,
          late_reason: dto.late_reason ?? null,
          check_in_ip_within_allowlist: withinAllowlist,
          ip_violation: violation,
          is_remote: dto.is_remote ?? false,
          source: 'employee',
        },
        { onConflict: 'user_id,work_date', ignoreDuplicates: false },
      )
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to create attendance record: ${error?.message ?? 'unknown error'}`,
      );
    }

    return data as Record<string, unknown>;
  }

  /**
   * Check-out: update today's attendance record with check-out fields.
   * Enforces IP restrictions, requires existing check-in, prevents duplicate, requires early_note when early.
   */
  async checkOut(
    companyId: string,
    userId: string,
    ip: string,
    dto: CheckOutDto,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // 1. Fetch company settings (timezone only; IP check uses resolveIpRestriction)
    const { timezone } = await this.getCompanySettings(companyId);

    // 1b. Fetch user's personal timezone override
    const { data: userRecord, error: userError } = await client
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (userError) {
      throw new InternalServerErrorException(`Failed to fetch user timezone: ${userError.message}`);
    }

    // Apply override: user timezone takes priority; fallback to company timezone
    const effectiveTimezone: string = (userRecord?.timezone as string | null) ?? timezone;

    // 2. IP check (CIDR-aware, with disabled mode; check-out has no is_remote flag)
    const { blocked, violation, withinAllowlist } = await this.resolveIpRestriction({
      companyId,
      ip,
      isRemote: false,
    });

    if (blocked) {
      throw new ForbiddenException(
        "Check-out blocked: your IP address is not in the company allowlist",
      );
    }

    // 3. Get work date in effective timezone
    const workDate = this.getWorkDate(effectiveTimezone);

    // 4. Fetch today's record
    const { data: record, error: recordError } = await client
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('work_date', workDate)
      .maybeSingle();

    if (recordError) {
      throw new InternalServerErrorException(
        `Failed to fetch attendance record: ${recordError.message}`,
      );
    }

    if (!record) {
      throw new NotFoundException('No check-in found for today');
    }

    // 5. Prevent duplicate check-out
    if (record.check_out_at !== null) {
      throw new ConflictException('Already checked out today');
    }

    // 6. Get active shift and classify check-out
    const now = new Date();
    const shift = await this.shiftAssignmentsService.getActiveShift(companyId, userId);

    let checkOutStatus: 'on-time' | 'early' | 'absent_afternoon' = 'on-time';
    let minutesEarly = 0;

    if (shift) {
      const classification = this.classifyCheckOut(now, shift, effectiveTimezone);
      checkOutStatus = classification.status;
      minutesEarly = classification.minutesEarly;
    }

    // 7. Require early_note if early
    if (checkOutStatus === 'early' && !dto.early_note) {
      throw new BadRequestException('Early check-out requires a note');
    }

    // 8. Update record
    const { data, error } = await client
      .from('attendance_records')
      .update({
        check_out_at: now.toISOString(),
        check_out_photo_url: dto.photo_url ?? null,
        check_out_ip: ip,
        check_out_status: checkOutStatus,
        minutes_early: minutesEarly,
        early_note: dto.early_note ?? null,
        check_out_ip_within_allowlist: withinAllowlist,
        ip_violation: violation,
        updated_at: now.toISOString(),
      })
      .eq('id', record.id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to update attendance record: ${error?.message ?? 'unknown error'}`,
      );
    }

    return data as Record<string, unknown>;
  }

  /**
   * Get attendance history for a user for a given month.
   * Returns records ordered by work_date DESC.
   */
  async getHistory(
    companyId: string,
    userId: string,
    year: number,
    month: number,
  ): Promise<Record<string, unknown>[]> {
    const client = this.supabase.getClient();

    // Build date range for the given month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const { data, error } = await client
      .from('attendance_records')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .gte('work_date', startDate)
      .lt('work_date', endDate)
      .order('work_date', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch attendance history: ${error.message}`,
      );
    }

    return (data ?? []) as Record<string, unknown>[];
  }

  /**
   * List all attendance records for a company in a given month.
   * Admin/Manager only. Optionally filter by userId.
   * When managerId is provided, scopes records to employees in the manager's divisions.
   * Returns records with user full_name.
   */
  async listRecords(
    companyId: string,
    year: number,
    month: number,
    userId?: string,
    managerId?: string,
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const client = this.supabase.getClient();
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    // If manager scope is requested, use division-based employee lookup
    let employeeIds: string[] | undefined;
    if (managerId) {
      // Step 1: Find divisions managed by this manager
      const { data: managedDivisions, error: divError } = await client
        .from('divisions')
        .select('id')
        .eq('company_id', companyId)
        .eq('manager_id', managerId);

      if (divError) {
        throw new InternalServerErrorException(
          `Failed to fetch manager's divisions: ${divError.message}`,
        );
      }

      const divisionIds = (managedDivisions ?? []).map((d: Record<string, unknown>) => d.id as string);

      // If manager has no divisions, return empty immediately
      if (divisionIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      // Step 2: Find employees in those divisions
      const { data: employees, error: empError } = await client
        .from('users')
        .select('id')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('division_id', divisionIds);

      if (empError) {
        throw new InternalServerErrorException(
          `Failed to fetch division employees: ${empError.message}`,
        );
      }

      employeeIds = (employees ?? []).map((e: Record<string, unknown>) => e.id as string);

      // If no employees in those divisions, return empty immediately
      if (employeeIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }
    }

    // Build date range for the given month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    let query = client
      .from('attendance_records')
      .select(`*, users!user_id ( full_name, email )`, { count: 'exact' })
      .eq('company_id', companyId)
      .gte('work_date', startDate)
      .lt('work_date', endDate)
      .order('work_date', { ascending: false });

    if (employeeIds) {
      query = query.in('user_id', employeeIds);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch attendance records: ${error.message}`,
      );
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      page,
      limit,
    };
  }

  /**
   * Returns a team summary for a manager: total records, late count,
   * punctuality rate, and daily breakdown for the given month.
   * Scoped to employees in the manager's divisions.
   */
  async getTeamSummary(
    companyId: string,
    managerId: string,
    year: number,
    month: number,
  ): Promise<{
    total: number;
    late: number;
    punctualityRate: number;
    monthlyBreakdown: Array<{ date: string; present: number; late: number }>;
  }> {
    const client = this.supabase.getClient();

    // Step 1: Find divisions managed by this manager
    const { data: managedDivisions, error: divError } = await client
      .from('divisions')
      .select('id')
      .eq('company_id', companyId)
      .eq('manager_id', managerId);

    if (divError) {
      throw new InternalServerErrorException(
        `Failed to fetch manager's divisions: ${divError.message}`,
      );
    }

    const divisionIds = (managedDivisions ?? []).map((d: Record<string, unknown>) => d.id as string);

    // If manager has no divisions, return zero stats
    if (divisionIds.length === 0) {
      return { total: 0, late: 0, punctualityRate: 100, monthlyBreakdown: [] };
    }

    // Step 2: Find employees in those divisions
    const { data: employees, error: empError } = await client
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .in('division_id', divisionIds);

    if (empError) {
      throw new InternalServerErrorException(
        `Failed to fetch division employees: ${empError.message}`,
      );
    }

    const employeeIds = (employees ?? []).map((e: Record<string, unknown>) => e.id as string);

    // If no employees in those divisions, return zero stats
    if (employeeIds.length === 0) {
      return { total: 0, late: 0, punctualityRate: 100, monthlyBreakdown: [] };
    }

    // 3. Build date range and fetch attendance records
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const { data: records, error: recError } = await client
      .from('attendance_records')
      .select('work_date, check_in_status')
      .eq('company_id', companyId)
      .in('user_id', employeeIds)
      .gte('work_date', startDate)
      .lt('work_date', endDate);

    if (recError) {
      throw new InternalServerErrorException(
        `Failed to fetch team attendance records: ${recError.message}`,
      );
    }

    const rows = (records ?? []) as Array<{ work_date: string; check_in_status: string }>;

    // 4. Compute totals
    const total = rows.length;
    const late = rows.filter((r) => r.check_in_status === 'late').length;
    const punctualityRate = total === 0 ? 100 : Math.round(((total - late) / total) * 100);

    // 5. Build daily breakdown (group by work_date)
    const dateMap = new Map<string, { present: number; late: number }>();
    for (const row of rows) {
      const entry = dateMap.get(row.work_date) ?? { present: 0, late: 0 };
      entry.present += 1;
      if (row.check_in_status === 'late') {
        entry.late += 1;
      }
      dateMap.set(row.work_date, entry);
    }

    const monthlyBreakdown = Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, late, punctualityRate, monthlyBreakdown };
  }

  /**
   * Returns company-wide executive summary for a given month.
   * Includes attendance rate, late ranking (top 10), and daily breakdown.
   */
  async getExecutiveSummary(
    companyId: string,
    year: number,
    month: number,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // Build date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    // Fetch all records for the month with user join
    const { data: records, error: recordsError } = await client
      .from('attendance_records')
      .select(`
        *,
        users!user_id (
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .gte('work_date', startDate)
      .lt('work_date', endDate);

    if (recordsError) {
      throw new InternalServerErrorException(
        `Failed to fetch attendance records: ${recordsError.message}`,
      );
    }

    const allRecords = records ?? [];

    // Fetch total active users for attendance rate calculation
    const { data: activeUsers, error: usersError } = await client
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (usersError) {
      throw new InternalServerErrorException(
        `Failed to fetch active users: ${usersError.message}`,
      );
    }

    const totalActiveUsers = (activeUsers ?? []).length;

    // Compute attendance rate: distinct users with at least one record / total active users
    const distinctUserIds = new Set(
      allRecords.map((r: Record<string, unknown>) => r.user_id as string),
    );
    const presentUsers = distinctUserIds.size;
    const attendanceRate =
      totalActiveUsers > 0
        ? Math.round((presentUsers / totalActiveUsers) * 1000) / 10
        : 0;

    // Compute total late count
    const lateCount = allRecords.filter(
      (r: Record<string, unknown>) => r.check_in_status === 'late',
    ).length;

    // Compute late ranking: group by user_id, count late records, sort desc, take top 10
    const userLateMap = new Map<
      string,
      { fullName: string; lateCount: number; totalDays: number }
    >();

    for (const record of allRecords as Record<string, unknown>[]) {
      const userId = record.user_id as string;
      const usersJoin = record.users as Record<string, unknown> | null;
      const fullName = (usersJoin?.full_name as string) ?? 'Unknown';
      const existing = userLateMap.get(userId);
      if (existing) {
        existing.totalDays += 1;
        if (record.check_in_status === 'late') {
          existing.lateCount += 1;
        }
      } else {
        userLateMap.set(userId, {
          fullName,
          lateCount: record.check_in_status === 'late' ? 1 : 0,
          totalDays: 1,
        });
      }
    }

    const lateRanking = Array.from(userLateMap.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.lateCount - a.lateCount)
      .slice(0, 10);

    // Compute monthly breakdown: group by work_date
    const dateMap = new Map<
      string,
      { date: string; present: number; late: number; missingCheckout: number }
    >();

    for (const record of allRecords as Record<string, unknown>[]) {
      const date = record.work_date as string;
      const existing = dateMap.get(date);
      if (existing) {
        existing.present += 1;
        if (record.check_in_status === 'late') existing.late += 1;
        if (record.missing_checkout === true) existing.missingCheckout += 1;
      } else {
        dateMap.set(date, {
          date,
          present: 1,
          late: record.check_in_status === 'late' ? 1 : 0,
          missingCheckout: record.missing_checkout === true ? 1 : 0,
        });
      }
    }

    const monthlyBreakdown = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      attendanceRate,
      totalRecords: allRecords.length,
      lateCount,
      lateRanking,
      monthlyBreakdown,
    };
  }

  /**
   * Returns full monthly attendance records with late statistics.
   * Optionally scoped to a manager's employees when managerId is provided.
   * pagination controls which slice of records is returned; stats always reflect the full month.
   */
  async getMonthlyReport(
    companyId: string,
    year: number,
    month: number,
    managerId?: string,
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // Build date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    // If managerId provided, scope to employees in the manager's divisions
    let userIds: string[] | undefined;
    if (managerId) {
      // Step 1: Find divisions managed by this manager
      const { data: managedDivisions, error: divError } = await client
        .from('divisions')
        .select('id')
        .eq('company_id', companyId)
        .eq('manager_id', managerId);

      if (divError) {
        throw new InternalServerErrorException(
          `Failed to fetch manager's divisions: ${divError.message}`,
        );
      }

      const divisionIds = (managedDivisions ?? []).map((d: Record<string, unknown>) => d.id as string);

      // If manager has no divisions, return empty immediately
      if (divisionIds.length === 0) {
        return {
          records: [],
          stats: {
            total: 0,
            lateCount: 0,
            onTimeCount: 0,
            withinGraceCount: 0,
            missingCheckoutCount: 0,
            lateRate: 0,
          },
          total: 0,
          page: pagination.page ?? 1,
          limit: pagination.limit ?? 20,
        };
      }

      // Step 2: Find employees in those divisions
      const { data: managedUsers, error: usersError } = await client
        .from('users')
        .select('id')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('division_id', divisionIds);

      if (usersError) {
        throw new InternalServerErrorException(
          `Failed to fetch division employees: ${usersError.message}`,
        );
      }

      userIds = (managedUsers ?? []).map(
        (u: Record<string, unknown>) => u.id as string,
      );
    }

    // If manager has no employees in their divisions, return empty
    if (userIds !== undefined && userIds.length === 0) {
      return {
        records: [],
        stats: {
          total: 0,
          lateCount: 0,
          onTimeCount: 0,
          withinGraceCount: 0,
          missingCheckoutCount: 0,
          lateRate: 0,
        },
        total: 0,
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
      };
    }

    // Build query
    let query = client
      .from('attendance_records')
      .select(`
        *,
        users!user_id (
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .gte('work_date', startDate)
      .lt('work_date', endDate)
      .order('work_date', { ascending: false });

    if (userIds !== undefined) {
      query = query.in('user_id', userIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch monthly records: ${error.message}`,
      );
    }

    const reportRecords = data ?? [];
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    // Slice records for the requested page; stats always reflect the full dataset
    const pagedRecords = reportRecords.slice((page - 1) * limit, page * limit);

    const total = reportRecords.length;
    const lateCount = reportRecords.filter(
      (r: Record<string, unknown>) => r.check_in_status === 'late',
    ).length;
    const onTimeCount = reportRecords.filter(
      (r: Record<string, unknown>) => r.check_in_status === 'on-time',
    ).length;
    const withinGraceCount = reportRecords.filter(
      (r: Record<string, unknown>) => r.check_in_status === 'within-grace',
    ).length;
    const missingCheckoutCount = reportRecords.filter(
      (r: Record<string, unknown>) => r.missing_checkout === true,
    ).length;
    const lateRate = total > 0 ? Math.round((lateCount / total) * 1000) / 10 : 0;

    return {
      records: pagedRecords,
      stats: {
        total,
        lateCount,
        onTimeCount,
        withinGraceCount,
        missingCheckoutCount,
        lateRate,
      },
      total,
      page,
      limit,
    };
  }

  /**
   * Exports monthly attendance records as a CSV string.
   * Optionally scoped to a manager's employees when managerId is provided.
   */
  async exportCsv(
    companyId: string,
    year: number,
    month: number,
    managerId?: string,
  ): Promise<string> {
    try {
      // Use a large limit to ensure exportCsv always fetches all records in one call.
      // The @Max(100) constraint on PaginationDto only applies at the HTTP layer (ValidationPipe);
      // internal callers can exceed it by constructing the DTO directly.
      const exportPagination = Object.assign(new PaginationDto(), { page: 1, limit: 100000 });
      const report = await this.getMonthlyReport(companyId, year, month, managerId, exportPagination);
      const csvRecords = report.records as Record<string, unknown>[];

      const escapeValue = (val: unknown): string => {
        const str = val == null ? '' : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const header =
        'Date,Employee,Check-in,Check-out,Status,Minutes Late,Late Reason,Early Note,Missing Checkout,Source';

      const rows = csvRecords.map((record: Record<string, unknown>) => {
        const usersJoin = record.users as Record<string, unknown> | null;
        const employeeName = (usersJoin?.full_name as string) ?? '';
        const checkIn = record.check_in_at
          ? new Date(record.check_in_at as string).toLocaleString('en-US', {
              timeZone: 'UTC',
            })
          : '';
        const checkOut = record.check_out_at
          ? new Date(record.check_out_at as string).toLocaleString('en-US', {
              timeZone: 'UTC',
            })
          : '';
        const status = (record.check_in_status as string) ?? '';
        const minutesLate =
          record.minutes_late != null ? String(record.minutes_late) : '';
        const lateReason = (record.late_reason as string) ?? '';
        const earlyNote = (record.early_note as string) ?? '';
        const missingCheckout = record.missing_checkout === true ? 'Yes' : 'No';
        const source = (record.source as string) ?? '';

        return [
          escapeValue(record.work_date),
          escapeValue(employeeName),
          escapeValue(checkIn),
          escapeValue(checkOut),
          escapeValue(status),
          escapeValue(minutesLate),
          escapeValue(lateReason),
          escapeValue(earlyNote),
          escapeValue(missingCheckout),
          escapeValue(source),
        ].join(',');
      });

      return [header, ...rows].join('\n');
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Failed to generate CSV: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Admin adjusts check_in_at and/or check_out_at on an existing record.
   * Stores one audit row per changed field in attendance_adjustments.
   * Requires reason. Admin and Owner roles only (enforced in controller).
   */
  async adjustRecord(
    companyId: string,
    adminUserId: string,
    recordId: string,
    dto: AdjustRecordDto,
  ): Promise<Record<string, unknown>> {
    if (!dto.check_in_at && !dto.check_out_at) {
      throw new BadRequestException('At least one of check_in_at or check_out_at must be provided');
    }

    const client = this.supabase.getClient();

    // Fetch the record to verify it belongs to this company and to capture old values
    const { data: record, error: fetchError } = await client
      .from('attendance_records')
      .select('id, company_id, check_in_at, check_out_at')
      .eq('id', recordId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(`Failed to fetch record: ${fetchError.message}`);
    }
    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    // Build the update payload and audit rows
    const updatePayload: Record<string, unknown> = {
      source: 'admin',
      updated_at: new Date().toISOString(),
    };

    const auditRows: Array<{
      record_id: string;
      company_id: string;
      adjusted_by: string;
      field_name: string;
      old_value: string | null;
      new_value: string;
      reason: string;
    }> = [];

    if (dto.check_in_at) {
      updatePayload.check_in_at = dto.check_in_at;
      auditRows.push({
        record_id: recordId,
        company_id: companyId,
        adjusted_by: adminUserId,
        field_name: 'check_in_at',
        old_value: (record.check_in_at as string | null) ?? null,
        new_value: dto.check_in_at,
        reason: dto.reason,
      });
    }

    if (dto.check_out_at) {
      updatePayload.check_out_at = dto.check_out_at;
      // Clear missing_checkout flag if setting a checkout time
      updatePayload.missing_checkout = false;
      auditRows.push({
        record_id: recordId,
        company_id: companyId,
        adjusted_by: adminUserId,
        field_name: 'check_out_at',
        old_value: (record.check_out_at as string | null) ?? null,
        new_value: dto.check_out_at,
        reason: dto.reason,
      });
    }

    // Apply the update to attendance_records
    const { data: updated, error: updateError } = await client
      .from('attendance_records')
      .update(updatePayload)
      .eq('id', recordId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new InternalServerErrorException(
        `Failed to update record: ${updateError?.message ?? 'unknown error'}`,
      );
    }

    // Insert audit rows
    if (auditRows.length > 0) {
      const { error: auditError } = await client
        .from('attendance_adjustments')
        .insert(auditRows);

      if (auditError) {
        throw new InternalServerErrorException(
          `Record updated but audit log failed: ${auditError.message}`,
        );
      }
    }

    return updated as Record<string, unknown>;
  }

  /**
   * Manager acknowledges a late/early-leave event on an attendance record.
   * Sets acknowledged_at and acknowledged_by on the record.
   * Only applicable when check_in_status = 'late' or check_out_status = 'early'.
   * Returns the updated record.
   */
  async acknowledgeRecord(
    companyId: string,
    managerId: string,
    recordId: string,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // Fetch and tenant-verify the record
    const { data: record, error: fetchError } = await client
      .from('attendance_records')
      .select('id, company_id, check_in_status, check_out_status, acknowledged_at')
      .eq('id', recordId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(`Failed to fetch record: ${fetchError.message}`);
    }
    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    // Only late/early records can be acknowledged
    const isLate = record.check_in_status === 'late';
    const isEarly = record.check_out_status === 'early';
    if (!isLate && !isEarly) {
      throw new BadRequestException('Record has no late or early-leave event to acknowledge');
    }

    // Idempotent: already acknowledged — return current state
    if (record.acknowledged_at) {
      const { data: current } = await client
        .from('attendance_records')
        .select('*')
        .eq('id', recordId)
        .single();
      return (current ?? {}) as Record<string, unknown>;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await client
      .from('attendance_records')
      .update({ acknowledged_at: now, acknowledged_by: managerId, updated_at: now })
      .eq('id', recordId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new InternalServerErrorException(
        `Failed to acknowledge record: ${updateError?.message ?? 'unknown error'}`,
      );
    }

    return updated as Record<string, unknown>;
  }

  /**
   * Manager acknowledges a Remote Work check-in on an attendance record.
   * Sets remote_acknowledged_at and remote_acknowledged_by on the record.
   * Only applicable when is_remote = true.
   * Returns the updated record.
   */
  async acknowledgeRemote(
    companyId: string,
    managerId: string,
    recordId: string,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    // Fetch and tenant-verify the record
    const { data: record, error: fetchError } = await client
      .from('attendance_records')
      .select('id, company_id, is_remote, remote_acknowledged_at')
      .eq('id', recordId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(`Failed to fetch record: ${fetchError.message}`);
    }
    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    // Only remote records can be remote-acknowledged
    if (!record.is_remote) {
      throw new BadRequestException('Record is not a Remote Work check-in');
    }

    // Idempotent: already acknowledged — return current state
    if (record.remote_acknowledged_at) {
      const { data: current } = await client
        .from('attendance_records')
        .select('*')
        .eq('id', recordId)
        .single();
      return (current ?? {}) as Record<string, unknown>;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await client
      .from('attendance_records')
      .update({ remote_acknowledged_at: now, remote_acknowledged_by: managerId, updated_at: now })
      .eq('id', recordId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new InternalServerErrorException(
        `Failed to acknowledge remote record: ${updateError?.message ?? 'unknown error'}`,
      );
    }

    return updated as Record<string, unknown>;
  }
}
