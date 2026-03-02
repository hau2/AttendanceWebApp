import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignShiftDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  /** ISO date string 'YYYY-MM-DD' */
  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;
}
