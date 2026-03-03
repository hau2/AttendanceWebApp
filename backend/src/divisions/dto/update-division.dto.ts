import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class UpdateDivisionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  // Send null explicitly to clear the manager, undefined = don't change
  @IsOptional()
  @IsUUID()
  managerId?: string | null;
}
