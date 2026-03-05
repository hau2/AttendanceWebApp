import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  morning_end_time: string | null;
  afternoon_start_time: string | null;
  created_at: string;
}

@Injectable()
export class ShiftsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listShifts(companyId: string): Promise<Shift[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('shifts')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      throw new ConflictException(`Failed to list shifts: ${error.message}`);
    }

    return (data ?? []) as Shift[];
  }

  async createShift(companyId: string, dto: CreateShiftDto): Promise<Shift> {
    const client = this.supabase.getClient();

    // Cross-field validation: both window fields must be set together or both empty
    const hasMorningEnd = !!dto.morningEndTime;
    const hasAfternoonStart = !!dto.afternoonStartTime;
    if (hasMorningEnd !== hasAfternoonStart) {
      throw new BadRequestException('morningEndTime and afternoonStartTime must both be set or both be empty');
    }
    if (hasMorningEnd && hasAfternoonStart) {
      const morningEndMinutes = dto.morningEndTime!.split(':').reduce((h, m, i) => i === 0 ? +m * 60 : h + +m, 0);
      const afternoonStartMinutes = dto.afternoonStartTime!.split(':').reduce((h, m, i) => i === 0 ? +m * 60 : h + +m, 0);
      if (afternoonStartMinutes <= morningEndMinutes) {
        throw new BadRequestException('afternoonStartTime must be after morningEndTime');
      }
    }

    const { data, error } = await client
      .from('shifts')
      .insert({
        company_id: companyId,
        name: dto.name,
        start_time: dto.startTime,
        end_time: dto.endTime,
        grace_period_minutes: dto.gracePeriodMinutes,
        morning_end_time: dto.morningEndTime ?? null,
        afternoon_start_time: dto.afternoonStartTime ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new ConflictException(`Failed to create shift: ${error.message}`);
    }

    return data as Shift;
  }

  async updateShift(companyId: string, shiftId: string, dto: UpdateShiftDto): Promise<Shift> {
    const client = this.supabase.getClient();

    // Cross-field validation: both window fields must be set together or both empty
    const hasMorningEnd = dto.morningEndTime !== undefined && dto.morningEndTime !== null && dto.morningEndTime !== '';
    const hasAfternoonStart = dto.afternoonStartTime !== undefined && dto.afternoonStartTime !== null && dto.afternoonStartTime !== '';
    if (hasMorningEnd !== hasAfternoonStart) {
      throw new BadRequestException('morningEndTime and afternoonStartTime must both be set or both be empty');
    }
    if (hasMorningEnd && hasAfternoonStart) {
      const morningEndMinutes = dto.morningEndTime!.split(':').reduce((h, m, i) => i === 0 ? +m * 60 : h + +m, 0);
      const afternoonStartMinutes = dto.afternoonStartTime!.split(':').reduce((h, m, i) => i === 0 ? +m * 60 : h + +m, 0);
      if (afternoonStartMinutes <= morningEndMinutes) {
        throw new BadRequestException('afternoonStartTime must be after morningEndTime');
      }
    }

    // Build update payload from only the fields explicitly provided
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.startTime !== undefined) {
      updateData.start_time = dto.startTime;
    }
    if (dto.endTime !== undefined) {
      updateData.end_time = dto.endTime;
    }
    if (dto.gracePeriodMinutes !== undefined) {
      updateData.grace_period_minutes = dto.gracePeriodMinutes;
    }
    if (dto.morningEndTime !== undefined) {
      updateData.morning_end_time = dto.morningEndTime || null;
    }
    if (dto.afternoonStartTime !== undefined) {
      updateData.afternoon_start_time = dto.afternoonStartTime || null;
    }

    const { data, error } = await client
      .from('shifts')
      .update(updateData)
      .eq('id', shiftId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new ConflictException(`Failed to update shift: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Shift not found');
    }

    return data as Shift;
  }
}
