import { IsNotEmpty, IsString, IsInt, Min, IsEmail } from 'class-validator';

export class CompleteOnboardingDto {
  // Step 1: Timezone already saved via PATCH /company/settings — not needed here

  // Step 2: First shift
  @IsNotEmpty()
  @IsString()
  shiftName: string;

  @IsNotEmpty()
  @IsString()
  shiftStartTime: string; // "HH:MM" format, e.g. "08:00"

  @IsNotEmpty()
  @IsString()
  shiftEndTime: string; // "HH:MM" format

  @IsInt()
  @Min(0)
  gracePeriodMinutes: number;

  // Step 3: First employee
  @IsNotEmpty()
  @IsString()
  firstUserFullName: string;

  @IsEmail()
  firstUserEmail: string;

  @IsString()
  @IsNotEmpty()
  firstUserPassword: string;
}
