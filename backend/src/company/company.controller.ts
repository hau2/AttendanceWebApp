import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyService } from './company.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { AddIpEntryDto } from './dto/add-ip-entry.dto';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('settings')
  async getSettings(@Request() req: any) {
    return this.companyService.getSettings(req.user.companyId);
  }

  @Patch('settings')
  async updateSettings(@Request() req: any, @Body() dto: UpdateCompanySettingsDto) {
    return this.companyService.updateSettings(req.user.companyId, dto);
  }

  @Post('ip-allowlist')
  async addIpEntry(@Request() req: any, @Body() dto: AddIpEntryDto) {
    if (!['admin', 'owner'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.companyService.addIpEntry(req.user.companyId, dto);
  }

  @Delete('ip-allowlist/:index')
  async removeIpEntry(@Request() req: any, @Param('index', ParseIntPipe) index: number) {
    if (!['admin', 'owner'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.companyService.removeIpEntry(req.user.companyId, index);
  }
}
