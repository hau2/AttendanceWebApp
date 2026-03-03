import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';

@Controller('divisions')
@UseGuards(JwtAuthGuard)
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  /** POST /divisions — create a new division (admin/owner only) */
  @Post()
  createDivision(@Request() req: any, @Body() dto: CreateDivisionDto) {
    const { role, companyId } = req.user as { role: string; companyId: string };
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Admin or Owner role required');
    }
    return this.divisionsService.createDivision(companyId, dto);
  }

  /** GET /divisions — list all divisions with manager name (admin/owner/executive) */
  @Get()
  listDivisions(@Request() req: any) {
    const { role, companyId } = req.user as { role: string; companyId: string };
    if (!['admin', 'owner', 'executive'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.divisionsService.listDivisions(companyId);
  }

  /** PATCH /divisions/:id — update division name or manager (admin/owner only) */
  @Patch(':id')
  updateDivision(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDivisionDto,
  ) {
    const { role, companyId } = req.user as { role: string; companyId: string };
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Admin or Owner role required');
    }
    return this.divisionsService.updateDivision(companyId, id, dto);
  }

  /** DELETE /divisions/:id — delete a division (blocked if employees assigned) */
  @Delete(':id')
  deleteDivision(@Request() req: any, @Param('id') id: string) {
    const { role, companyId } = req.user as { role: string; companyId: string };
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Admin or Owner role required');
    }
    return this.divisionsService.deleteDivision(companyId, id);
  }
}
