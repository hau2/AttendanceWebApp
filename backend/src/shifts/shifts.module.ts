import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { ShiftAssignmentsController } from './shift-assignments.controller';

// SupabaseModule is @Global — no need to import it here.
@Module({
  imports: [],
  providers: [ShiftsService, ShiftAssignmentsService],
  controllers: [ShiftsController, ShiftAssignmentsController],
  // Export both services: Phase 3 attendance needs ShiftAssignmentsService
  // to resolve active shift at check-in time.
  exports: [ShiftsService, ShiftAssignmentsService],
})
export class ShiftsModule {}
