import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['owner', 'admin', 'manager', 'employee', 'executive'])
  role: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsUUID()
  divisionId?: string;
}
