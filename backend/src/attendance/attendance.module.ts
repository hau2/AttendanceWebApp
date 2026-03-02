import { Module } from '@nestjs/common';
import { PhotoUploadController } from './photo-upload.controller';

// NOTE: AttendanceService and AttendanceController are added by Plan 03-01.
// This module is created by Plan 03-02 (photo storage) and extended by Plan 03-01 (check-in/out).

@Module({
  imports: [],
  providers: [],
  controllers: [PhotoUploadController],
  exports: [],
})
export class AttendanceModule {}
