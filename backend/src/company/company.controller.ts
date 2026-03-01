import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyService } from './company.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

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
}
