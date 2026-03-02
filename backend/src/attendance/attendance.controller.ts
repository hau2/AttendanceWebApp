import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Request() req: any, @Body() dto: CheckInDto) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    return this.attendanceService.checkIn(req.user.companyId, req.user.userId, ip, dto);
  }

  @Post('check-out')
  async checkOut(@Request() req: any, @Body() dto: CheckOutDto) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    return this.attendanceService.checkOut(req.user.companyId, req.user.userId, ip, dto);
  }

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.attendanceService.getHistory(req.user.companyId, req.user.userId, y, m);
  }

  /**
   * Admin/Manager: list attendance records for all users in the company (filtered by date range).
   * Optionally filter by userId.
   */
  @Get('records')
  async listRecords(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('userId') userId?: string,
  ) {
    const { role, companyId } = req.user;
    if (!['admin', 'owner', 'manager'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.attendanceService.listRecords(companyId, y, m, userId);
  }
}
