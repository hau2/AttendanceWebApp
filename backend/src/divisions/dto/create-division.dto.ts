import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
