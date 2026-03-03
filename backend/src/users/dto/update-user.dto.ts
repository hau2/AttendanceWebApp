import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserDto {
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
