import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class AddIpEntryDto {
  @IsString()
  @Matches(
    /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
    { message: 'cidr must be a valid IPv4 address or CIDR range (e.g. 192.168.1.1 or 192.168.1.0/24)' }
  )
  cidr: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}
