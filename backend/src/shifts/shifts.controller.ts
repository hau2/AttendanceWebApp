import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /** GET /shifts — list all shifts in the caller's company */
  @Get()
  listShifts(@Request() req: { user: { companyId: string } }) {
    return this.shiftsService.listShifts(req.user.companyId);
  }

  /** POST /shifts — create a new shift in the caller's company */
  @Post()
  createShift(
    @Request() req: { user: { companyId: string } },
    @Body() dto: CreateShiftDto,
  ) {
    return this.shiftsService.createShift(req.user.companyId, dto);
  }

  /** PATCH /shifts/:id — update an existing shift */
  @Patch(':id')
  updateShift(
    @Request() req: { user: { companyId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftsService.updateShift(req.user.companyId, id, dto);
  }
}
