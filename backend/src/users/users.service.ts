import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async listUsers(companyId: string): Promise<object[]> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('users')
      .select(`
        *,
        divisions (
          id,
          name,
          manager_id,
          users!divisions_manager_id_fkey (
            id,
            full_name
          )
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to list users: ${error.message}`);
    }

    return data ?? [];
  }

  async createUser(companyId: string, dto: CreateUserDto): Promise<object> {
    const client = this.supabase.getClient();

    // 1. Create Supabase auth user (sets app_metadata for RLS claims)
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      app_metadata: { company_id: companyId, role: dto.role },
    });

    if (authError) {
      throw new ConflictException(`Failed to create auth user: ${authError.message}`);
    }

    // 2. Insert into public.users
    const { data: user, error: userError } = await client
      .from('users')
      .insert({
        id: authData.user.id,
        company_id: companyId,
        full_name: dto.fullName,
        email: dto.email,
        role: dto.role,
        manager_id: dto.managerId ?? null,
        division_id: dto.divisionId ?? null,
      })
      .select()
      .single();

    if (userError) {
      // Rollback: remove the auth user to prevent orphaned records
      await client.auth.admin.deleteUser(authData.user.id);
      throw new ConflictException(`Failed to create user record: ${userError.message}`);
    }

    return user;
  }

  async updateUser(companyId: string, userId: string, dto: UpdateUserDto): Promise<object> {
    const client = this.supabase.getClient();

    // Build update payload from only the fields explicitly provided
    const updateData: Record<string, unknown> = {};

    if (dto.fullName !== undefined) {
      updateData.full_name = dto.fullName;
    }

    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone; // null clears it; string sets it
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }
    if (dto.managerId !== undefined) {
      updateData.manager_id = dto.managerId;
    }
    if (dto.divisionId !== undefined) {
      // Verify the target division belongs to this company
      const { data: div, error: divErr } = await client
        .from('divisions')
        .select('id')
        .eq('id', dto.divisionId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (divErr) {
        throw new InternalServerErrorException(
          `Failed to verify division: ${divErr.message}`,
        );
      }

      if (!div) {
        throw new BadRequestException('Division not found or does not belong to this company');
      }

      updateData.division_id = dto.divisionId;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('User not found');
    }

    // If role changed, update app_metadata so new JWT tokens carry correct role claim
    if (dto.role !== undefined) {
      const { error: authUpdateError } = await client.auth.admin.updateUserById(userId, {
        app_metadata: { company_id: companyId, role: dto.role },
      });
      if (authUpdateError) {
        throw new BadRequestException(`Failed to update auth metadata: ${authUpdateError.message}`);
      }
    }

    return data;
  }

  async deleteUser(companyId: string, userId: string): Promise<void> {
    const client = this.supabase.getClient();

    // 1. Verify user belongs to this company before deleting
    const { data: user, error: fetchError } = await client
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(`Failed to fetch user: ${fetchError.message}`);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Cannot delete an owner
    if (user.role === 'owner') {
      throw new BadRequestException('Cannot delete the company owner');
    }

    // 3. Delete from Supabase Auth (removes login capability)
    const { error: authError } = await client.auth.admin.deleteUser(userId);
    if (authError) {
      throw new InternalServerErrorException(`Failed to delete auth account: ${authError.message}`);
    }

    // 4. Set is_active = false on public.users row (row preserved for history)
    const { error: updateError } = await client
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('company_id', companyId);

    if (updateError) {
      // Auth account already deleted — log error but surface as internal error
      throw new InternalServerErrorException(
        `Auth deleted but failed to deactivate user record: ${updateError.message}`,
      );
    }
  }

  async validateManagerDivisionOwnership(
    companyId: string,
    managerId: string,
    divisionId: string,
  ): Promise<void> {
    const client = this.supabase.getClient();
    const { data: division, error } = await client
      .from('divisions')
      .select('id, manager_id')
      .eq('id', divisionId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Failed to verify division: ${error.message}`);
    }

    if (!division) {
      throw new BadRequestException('Division not found');
    }

    if (division.manager_id !== managerId) {
      throw new ForbiddenException('You can only assign employees to divisions you manage');
    }
  }

  async setUserStatus(companyId: string, userId: string, isActive: boolean): Promise<object> {
    const client = this.supabase.getClient();

    // 1. Update public.users is_active flag
    const { data, error } = await client
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user status: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('User not found');
    }

    // 2. Sync Supabase Auth ban state so the user cannot obtain new tokens
    // ban_duration='none' re-enables; '876000h' (~100 years) effectively bans
    const { error: authError } = await client.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? 'none' : '876000h',
    });

    if (authError) {
      throw new BadRequestException(`Failed to update auth ban state: ${authError.message}`);
    }

    return data;
  }
}
