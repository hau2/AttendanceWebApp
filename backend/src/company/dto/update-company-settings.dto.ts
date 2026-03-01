import { IsIn, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['log-only', 'enforce-block'])
  ipMode?: 'log-only' | 'enforce-block';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipAllowlist?: string[];
}
