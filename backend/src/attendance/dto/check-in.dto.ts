import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsString()
  photo_url?: string; // Set after successful Supabase Storage upload; nullable in v1 if photo fails

  @IsOptional()
  @IsString()
  @MaxLength(500)
  late_reason?: string;

  @IsOptional()
  @IsBoolean()
  is_remote?: boolean;  // true = employee working remotely today
}
