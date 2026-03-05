import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['disabled', 'log-only', 'enforce-block'])
  ipMode?: 'disabled' | 'log-only' | 'enforce-block';
}
