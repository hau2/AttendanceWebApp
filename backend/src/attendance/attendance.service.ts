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
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
    // timeStr format: "HH:MM" (hour12: false with 2-digit gives 00-23)
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
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
   * Classify check-in as 'on-time', 'within-grace', or 'late'.
   * Returns status and minutes_late.
   */
  private classifyCheckIn(
    checkInAt: Date,
    shift: ShiftAssignmentWithShift,
    timezone: string,
  ): { status: 'on-time' | 'within-grace' | 'late'; minutesLate: number } {
    const checkInMinutes = this.getMinutesInTimezone(checkInAt, timezone);
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
   * Classify check-out as 'on-time' or 'early'.
   * Returns status and minutes_early.
   */
  private classifyCheckOut(
    checkOutAt: Date,
    shift: ShiftAssignmentWithShift,
    timezone: string,
  ): { status: 'on-time' | 'early'; minutesEarly: number } {
    const checkOutMinutes = this.getMinutesInTimezone(checkOutAt, timezone);
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
   * Check the caller's IP against the company's allowlist.
   * Returns { withinAllowlist, blocked }.
   * Empty allowlist = no restriction (pass-through).
   */
  private async checkIP(
    companyId: string,
    callerIp: string,
  ): Promise<{ withinAllowlist: boolean; blocked: boolean }> {
    const client = this.supabase.getClient();
    const { data: company, error } = await client
      .from('companies')
      .select('ip_mode, ip_allowlist')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      throw new InternalServerErrorException('Failed to fetch company settings');
    }

    const ipMode: string = company.ip_mode ?? 'log-only';
    const allowlist: string[] = company.ip_allowlist ?? [];

    // Empty allowlist = no restriction
    if (!allowlist || allowlist.length === 0) {
      return { withinAllowlist: true, blocked: false };
    }

    const withinAllowlist = allowlist.includes(callerIp);

    if (ipMode === 'enforce-block' && !withinAllowlist) {
      return { withinAllowlist: false, blocked: true };
    }

    return { withinAllowlist, blocked: false };
  }

  /**
   * Fetch company timezone and IP settings in one query.
   */
  private async getCompanySettings(
    companyId: string,
  ): Promise<{ timezone: string; ipMode: string; ipAllowlist: string[] }> {
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
      ipMode: company.ip_mode ?? 'log-only',
      ipAllowlist: company.ip_allowlist ?? [],
    };
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

    // 1. Fetch company settings
    const { timezone, ipMode, ipAllowlist } = await this.getCompanySettings(companyId);

    // 2. IP check
    const allowlist = ipAllowlist ?? [];
    let withinAllowlist = true;
    let blocked = false;

    if (allowlist.length > 0) {
      withinAllowlist = allowlist.includes(ip);
      if (ipMode === 'enforce-block' && !withinAllowlist) {
        blocked = true;
      }
    }

    if (blocked) {
      throw new ForbiddenException(
        "Check-in blocked: your IP address is not in the company allowlist",
      );
    }

    // 3. Get work date in company timezone
    const workDate = this.getWorkDate(timezone);

    // 4. Check for existing record (idempotency guard)
    const { data: existing, error: existingError } = await client
      .from('attendance_records')
      .select('id')
      .eq('user_id', userId)
      .eq('work_date', workDate)
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

    // 6. Classify check-in
    let checkInStatus: 'on-time' | 'within-grace' | 'late' = 'on-time';
    let minutesLate = 0;

    if (shift) {
      const classification = this.classifyCheckIn(now, shift, timezone);
      checkInStatus = classification.status;
      minutesLate = classification.minutesLate;
    }

    // 7. Require late_reason if late
    if (checkInStatus === 'late' && !dto.late_reason) {
      throw new BadRequestException('Late check-in requires a reason');
    }

    // 8. Insert attendance record
    const { data, error } = await client
      .from('attendance_records')
      .insert({
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
        source: 'employee',
      })
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

    // 1. Fetch company settings
    const { timezone, ipMode, ipAllowlist } = await this.getCompanySettings(companyId);

    // 2. IP check
    const allowlist = ipAllowlist ?? [];
    let withinAllowlist = true;
    let blocked = false;

    if (allowlist.length > 0) {
      withinAllowlist = allowlist.includes(ip);
      if (ipMode === 'enforce-block' && !withinAllowlist) {
        blocked = true;
      }
    }

    if (blocked) {
      throw new ForbiddenException(
        "Check-in blocked: your IP address is not in the company allowlist",
      );
    }

    // 3. Get work date
    const workDate = this.getWorkDate(timezone);

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

    let checkOutStatus: 'on-time' | 'early' = 'on-time';
    let minutesEarly = 0;

    if (shift) {
      const classification = this.classifyCheckOut(now, shift, timezone);
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
   * Returns records with user full_name.
   */
  async listRecords(
    companyId: string,
    year: number,
    month: number,
    userId?: string,
  ): Promise<Record<string, unknown>[]> {
    const client = this.supabase.getClient();

    // Build date range for the given month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    let query = client
      .from('attendance_records')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .gte('work_date', startDate)
      .lt('work_date', endDate)
      .order('work_date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch attendance records: ${error.message}`,
      );
    }

    return (data ?? []) as Record<string, unknown>[];
  }
}
