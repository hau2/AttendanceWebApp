import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AssignShiftDto } from './dto/assign-shift.dto';

export interface ShiftAssignment {
  id: string;
  company_id: string;
  user_id: string;
  shift_id: string;
  effective_date: string;
  created_at: string;
}

export interface ShiftAssignmentWithShift extends ShiftAssignment {
  shifts: {
    name: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
  };
}

@Injectable()
export class ShiftAssignmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Assign a shift to a user with an effective date.
   * Enforces tenant ownership of both shift and user.
   * History is preserved — old assignments are NOT deleted.
   */
  async assignShift(
    companyId: string,
    dto: AssignShiftDto,
  ): Promise<ShiftAssignment> {
    const client = this.supabase.getClient();

    // 1. Verify shift exists and belongs to this company
    const { data: shift, error: shiftErr } = await client
      .from('shifts')
      .select('id')
      .eq('id', dto.shiftId)
      .eq('company_id', companyId)
      .single();

    if (shiftErr || !shift) {
      throw new NotFoundException('Shift not found');
    }

    // 2. Verify user exists and belongs to this company
    const { data: user, error: userErr } = await client
      .from('users')
      .select('id')
      .eq('id', dto.userId)
      .eq('company_id', companyId)
      .single();

    if (userErr || !user) {
      throw new NotFoundException('User not found');
    }

    // 3. Insert assignment (history preserved — no delete of old records)
    const { data, error } = await client
      .from('employee_shifts')
      .insert({
        company_id: companyId,
        user_id: dto.userId,
        shift_id: dto.shiftId,
        effective_date: dto.effectiveDate,
      })
      .select()
      .single();

    if (error) {
      // UNIQUE violation on (user_id, effective_date)
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique')
      ) {
        throw new ConflictException(
          'An assignment already exists for this employee on this effective date. Choose a different date.',
        );
      }
      throw new ConflictException(`Failed to assign shift: ${error.message}`);
    }

    return data as ShiftAssignment;
  }

  /**
   * Get the active shift for a user: the assignment with the latest
   * effective_date that is <= today's date.
   * Returns null if the user has no active shift (not an error).
   */
  async getActiveShift(
    companyId: string,
    userId: string,
  ): Promise<ShiftAssignmentWithShift | null> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('employee_shifts')
      .select(
        `
        *,
        shifts (
          name,
          start_time,
          end_time,
          grace_period_minutes
        )
      `,
      )
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .lte('effective_date', new Date().toISOString().split('T')[0])
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new ConflictException(
        `Failed to get active shift: ${error.message}`,
      );
    }

    return (data as ShiftAssignmentWithShift) ?? null;
  }

  /**
   * List full assignment history for a user (most recent first).
   */
  async listAssignments(
    companyId: string,
    userId: string,
  ): Promise<ShiftAssignmentWithShift[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('employee_shifts')
      .select(
        `
        *,
        shifts (
          name,
          start_time,
          end_time,
          grace_period_minutes
        )
      `,
      )
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('effective_date', { ascending: false });

    if (error) {
      throw new ConflictException(
        `Failed to list assignments: ${error.message}`,
      );
    }

    return (data ?? []) as ShiftAssignmentWithShift[];
  }
}
