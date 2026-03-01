import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: object; company: object }> {
    const client = this.supabase.getClient();

    // 1. Create company first
    const { data: company, error: companyError } = await client
      .from('companies')
      .insert({ name: dto.companyName })
      .select()
      .single();

    if (companyError) {
      throw new ConflictException(`Failed to create company: ${companyError.message}`);
    }

    // 2. Create Supabase auth user
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // skip email confirmation for v1
      app_metadata: { company_id: company.id, role: 'owner' },
    });

    if (authError) {
      // Rollback: delete the company we just created
      await client.from('companies').delete().eq('id', company.id);
      throw new ConflictException(`Failed to create user: ${authError.message}`);
    }

    // 3. Create public.users record
    const { data: user, error: userError } = await client
      .from('users')
      .insert({
        id: authData.user.id,
        company_id: company.id,
        full_name: dto.fullName,
        email: dto.email,
        role: 'owner',
      })
      .select()
      .single();

    if (userError) {
      // Rollback
      await client.auth.admin.deleteUser(authData.user.id);
      await client.from('companies').delete().eq('id', company.id);
      throw new ConflictException(`Failed to create user record: ${userError.message}`);
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      company_id: company.id,
      role: user.role,
    });

    return { accessToken, user, company };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: object; company: object }> {
    const client = this.supabase.getClient();

    // Verify credentials via Supabase Auth
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Fetch user record from public.users
    const { data: user, error: userError } = await client
      .from('users')
      .select('*, companies(*)')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('User record not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      company_id: user.company_id,
      role: user.role,
    });

    return { accessToken, user, company: user.companies };
  }
}
