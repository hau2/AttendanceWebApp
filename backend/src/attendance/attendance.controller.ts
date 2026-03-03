import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  Request,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AdjustRecordDto } from './dto/adjust-record.dto';

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
   * When role=manager, automatically scopes to the manager's assigned employees.
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
    return this.attendanceService.listRecords(
      companyId,
      y,
      m,
      userId,
      role === 'manager' ? req.user.userId : undefined,
    );
  }

  /**
   * Admin/Manager/Owner: get team summary KPIs for the current user's managed employees.
   * Returns total records, late count, punctuality rate, and daily breakdown.
   * Note: must be declared BEFORE @Patch('records/:id') to avoid route conflict.
   */
  @Get('reports/team-summary')
  async getTeamSummary(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const { role, companyId, userId } = req.user;
    if (!['admin', 'owner', 'manager'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    // For admin/owner, use their own userId as managerId (returns their own managed employees)
    // In practice this endpoint is designed for manager role — admin sees their own managed employees
    const managerId = userId;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.attendanceService.getTeamSummary(companyId, managerId, y, m);
  }

  /**
   * Executive/Admin/Owner: company-wide attendance summary for a given month.
   * Returns attendanceRate, totalRecords, lateCount, lateRanking, monthlyBreakdown.
   * Note: must be declared BEFORE @Patch('records/:id') to avoid route conflict.
   */
  @Get('reports/executive')
  async getExecutiveSummary(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const { role, companyId } = req.user;
    if (!['executive', 'admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.attendanceService.getExecutiveSummary(companyId, y, m);
  }

  /**
   * Admin/Manager/Owner: full monthly records with late statistics.
   * When role=manager, automatically scoped to the manager's direct reports.
   * Note: must be declared BEFORE @Patch('records/:id') to avoid route conflict.
   */
  @Get('reports/monthly')
  async getMonthlyReport(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const { role, companyId, userId } = req.user;
    if (!['admin', 'owner', 'manager'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const managerId = role === 'manager' ? userId : undefined;
    return this.attendanceService.getMonthlyReport(companyId, y, m, managerId);
  }

  /**
   * Admin/Manager/Owner: export monthly attendance records as a CSV file.
   * When role=manager, automatically scoped to the manager's direct reports.
   * Note: must be declared BEFORE @Patch('records/:id') to avoid route conflict.
   */
  @Get('export/csv')
  async exportCsv(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const { role, companyId, userId } = req.user;
    if (!['admin', 'owner', 'manager'].includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const managerId = role === 'manager' ? userId : undefined;
    const csv = await this.attendanceService.exportCsv(companyId, y, m, managerId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance-${y}-${String(m).padStart(2, '0')}.csv"`,
    );
    res.send(csv);
  }

  /**
   * Admin/Owner: adjust check_in_at and/or check_out_at on an existing record.
   * Stores immutable audit rows in attendance_adjustments.
   */
  @Patch('records/:id')
  async adjustRecord(
    @Request() req: any,
    @Param('id') recordId: string,
    @Body() dto: AdjustRecordDto,
  ) {
    const { role, companyId, userId } = req.user;
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Only admins can adjust attendance records');
    }
    return this.attendanceService.adjustRecord(companyId, userId, recordId, dto);
  }
}
