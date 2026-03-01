import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly supabase: SupabaseService) {}

  async getSettings(companyId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('companies')
      .select('id, name, timezone, ip_mode, ip_allowlist, onboarding_complete')
      .eq('id', companyId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Company not found');
    }
    return data;
  }

  async updateSettings(companyId: string, dto: UpdateCompanySettingsDto) {
    const updateData: Record<string, unknown> = {};
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.ipMode !== undefined) updateData.ip_mode = dto.ipMode;
    if (dto.ipAllowlist !== undefined) updateData.ip_allowlist = dto.ipAllowlist;

    const { data, error } = await this.supabase
      .getClient()
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException(`Failed to update company: ${error.message}`);
    }
    return data;
  }
}
