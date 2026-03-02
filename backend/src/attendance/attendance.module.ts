import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PhotoUploadController } from './photo-upload.controller';
import { AttendanceCronService } from './attendance-cron.service';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [ShiftsModule], // provides ShiftAssignmentsService via DI
  providers: [AttendanceService, AttendanceCronService],
  controllers: [AttendanceController, PhotoUploadController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
