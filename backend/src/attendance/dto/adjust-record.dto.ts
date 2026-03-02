import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdjustRecordDto {
  @IsOptional()
  @IsISO8601()
  check_in_at?: string;

  @IsOptional()
  @IsISO8601()
  check_out_at?: string;

  @IsString()
  @MaxLength(500)
  reason: string;
}
