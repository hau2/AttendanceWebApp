import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { AddIpEntryDto } from './dto/add-ip-entry.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly supabase: SupabaseService) {}

  async getSettings(companyId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('companies')
      .select('id, name, timezone, ip_mode, ip_allowlist, onboarding_complete, last_refresh_at')
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

  async addIpEntry(companyId: string, dto: AddIpEntryDto) {
    const { data: company, error: fetchError } = await this.supabase
      .getClient()
      .from('companies')
      .select('ip_allowlist')
      .eq('id', companyId)
      .single();

    if (fetchError || !company) throw new NotFoundException('Company not found');

    const current: Array<{ cidr: string; label?: string }> = (company.ip_allowlist as Array<{ cidr: string; label?: string }>) ?? [];
    const entry: { cidr: string; label?: string } = { cidr: dto.cidr };
    if (dto.label) entry.label = dto.label;
    const updated = [...current, entry];

    const { data, error } = await this.supabase
      .getClient()
      .from('companies')
      .update({ ip_allowlist: updated })
      .eq('id', companyId)
      .select('ip_allowlist')
      .single();

    if (error) throw new NotFoundException(`Failed to add IP entry: ${error.message}`);
    return data;
  }

  async removeIpEntry(companyId: string, index: number) {
    const { data: company, error: fetchError } = await this.supabase
      .getClient()
      .from('companies')
      .select('ip_allowlist')
      .eq('id', companyId)
      .single();

    if (fetchError || !company) throw new NotFoundException('Company not found');

    const current: Array<{ cidr: string; label?: string }> = (company.ip_allowlist as Array<{ cidr: string; label?: string }>) ?? [];
    if (index < 0 || index >= current.length) throw new NotFoundException('IP entry not found');

    const updated = [...current.slice(0, index), ...current.slice(index + 1)];

    const { data, error } = await this.supabase
      .getClient()
      .from('companies')
      .update({ ip_allowlist: updated })
      .eq('id', companyId)
      .select('ip_allowlist')
      .single();

    if (error) throw new NotFoundException(`Failed to remove IP entry: ${error.message}`);
    return data;
  }
}
