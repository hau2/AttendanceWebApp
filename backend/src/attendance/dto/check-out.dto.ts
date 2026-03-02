import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckOutDto {
  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  early_note?: string;
}
