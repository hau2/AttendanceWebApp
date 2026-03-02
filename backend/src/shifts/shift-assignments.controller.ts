import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { AssignShiftDto } from './dto/assign-shift.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftAssignmentsController {
  constructor(
    private readonly shiftAssignmentsService: ShiftAssignmentsService,
  ) {}

  /**
   * POST /shifts/assign
   * Assign a shift to a user with an effective date.
   * Body: { userId, shiftId, effectiveDate }
   */
  @Post('assign')
  assignShift(
    @Request() req: { user: { companyId: string } },
    @Body() dto: AssignShiftDto,
  ) {
    return this.shiftAssignmentsService.assignShift(req.user.companyId, dto);
  }

  /**
   * GET /shifts/assignments/:userId
   * Returns { activeShift, history } for the given user.
   * activeShift is the assignment with the latest effective_date <= today,
   * or null if the user has no active shift.
   */
  @Get('assignments/:userId')
  async getAssignments(
    @Request() req: { user: { companyId: string } },
    @Param('userId') userId: string,
  ) {
    const [activeShift, history] = await Promise.all([
      this.shiftAssignmentsService.getActiveShift(req.user.companyId, userId),
      this.shiftAssignmentsService.listAssignments(req.user.companyId, userId),
    ]);

    return { activeShift, history };
  }
}
