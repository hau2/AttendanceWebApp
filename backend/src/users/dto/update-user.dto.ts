import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  timezone?: string | null; // IANA timezone string e.g. "America/New_York", null clears it

  @IsOptional()
  @IsIn(['owner', 'admin', 'manager', 'employee', 'executive'])
  role?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsUUID()
  divisionId?: string;
}
