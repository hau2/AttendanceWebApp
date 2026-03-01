import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly supabase: SupabaseService) {}

  async completeOnboarding(companyId: string, dto: CompleteOnboardingDto) {
    const client = this.supabase.getClient();

    // 1. Create first shift
    const { data: shift, error: shiftError } = await client
      .from('shifts')
      .insert({
        company_id: companyId,
        name: dto.shiftName,
        start_time: dto.shiftStartTime,
        end_time: dto.shiftEndTime,
        grace_period_minutes: dto.gracePeriodMinutes,
      })
      .select()
      .single();

    if (shiftError) {
      throw new BadRequestException(`Failed to create shift: ${shiftError.message}`);
    }

    // 2. Create first employee user in Supabase Auth
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: dto.firstUserEmail,
      password: dto.firstUserPassword,
      email_confirm: true,
      app_metadata: { company_id: companyId, role: 'employee' },
    });

    if (authError) {
      throw new BadRequestException(`Failed to create employee user: ${authError.message}`);
    }

    // 3. Create public.users record for first employee
    const { error: userError } = await client.from('users').insert({
      id: authData.user.id,
      company_id: companyId,
      full_name: dto.firstUserFullName,
      email: dto.firstUserEmail,
      role: 'employee',
    });

    if (userError) {
      await client.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(`Failed to create employee record: ${userError.message}`);
    }

    // 4. Mark onboarding complete
    const { error: companyError } = await client
      .from('companies')
      .update({ onboarding_complete: true })
      .eq('id', companyId);

    if (companyError) {
      throw new BadRequestException(`Failed to complete onboarding: ${companyError.message}`);
    }

    return { success: true, shiftId: shift.id };
  }
}
