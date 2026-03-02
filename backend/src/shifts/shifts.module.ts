import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';

// SupabaseModule is @Global — no need to import it here.
@Module({
  imports: [],
  providers: [ShiftsService],
  controllers: [ShiftsController],
  exports: [ShiftsService], // plan 04 ShiftAssignment module will need ShiftsService
})
export class ShiftsModule {}
