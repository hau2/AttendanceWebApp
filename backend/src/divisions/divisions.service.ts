import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';

@Injectable()
export class DivisionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createDivision(companyId: string, dto: CreateDivisionDto): Promise<object> {
    const client = this.supabase.getClient();
    try {
      const { data, error } = await client
        .from('divisions')
        .insert({
          company_id: companyId,
          name: dto.name,
          manager_id: dto.managerId ?? null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ConflictException('A division with this name already exists');
        }
        throw new BadRequestException(`Failed to create division: ${error.message}`);
      }

      return data;
    } catch (err: unknown) {
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Unexpected error creating division');
    }
  }

  async listDivisions(companyId: string): Promise<object[]> {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('divisions')
      .select('*, users!divisions_manager_id_fkey(id, full_name)')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to list divisions: ${error.message}`);
    }

    return data ?? [];
  }

  async updateDivision(companyId: string, divisionId: string, dto: UpdateDivisionDto): Promise<object> {
    const client = this.supabase.getClient();

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updateData['name'] = dto.name;
    }
    if (dto.managerId !== undefined) {
      updateData['manager_id'] = dto.managerId; // null = clear, UUID = set
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    updateData['updated_at'] = new Date().toISOString();

    try {
      const { data, error } = await client
        .from('divisions')
        .update(updateData)
        .eq('id', divisionId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ConflictException('A division with this name already exists');
        }
        throw new BadRequestException(`Failed to update division: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundException('Division not found');
      }

      return data;
    } catch (err: unknown) {
      if (
        err instanceof ConflictException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new BadRequestException('Unexpected error updating division');
    }
  }

  async deleteDivision(companyId: string, divisionId: string): Promise<void> {
    const client = this.supabase.getClient();

    // Check if division exists and count employees assigned to it
    const { count, error: countError } = await client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('division_id', divisionId);

    if (countError) {
      // If error on count query, division may not exist — treat as not found
      throw new NotFoundException('Division not found');
    }

    if (count !== null && count > 0) {
      throw new ConflictException(
        `Cannot delete division: ${count} employee(s) are still assigned to it. Reassign them first.`,
      );
    }

    // Proceed with deletion
    const { error: deleteError } = await client
      .from('divisions')
      .delete()
      .eq('id', divisionId)
      .eq('company_id', companyId);

    if (deleteError) {
      throw new BadRequestException(`Failed to delete division: ${deleteError.message}`);
    }
  }
}
