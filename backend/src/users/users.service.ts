import {
  Injectable,
  BadRequestException,
  ConflictException,
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
      .select('*')
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
    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }
    if (dto.managerId !== undefined) {
      updateData.manager_id = dto.managerId;
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
