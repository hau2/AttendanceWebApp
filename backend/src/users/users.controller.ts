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
import { IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

class SetStatusDto {
  @IsBoolean()
  isActive: boolean;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users — list all users in the caller's company */
  @Get()
  listUsers(@Request() req: { user: { companyId: string } }) {
    return this.usersService.listUsers(req.user.companyId);
  }

  /** POST /users — create a new user in the caller's company */
  @Post()
  createUser(
    @Request() req: { user: { companyId: string } },
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(req.user.companyId, dto);
  }

  /** PATCH /users/:id — update role and/or managerId for a user */
  @Patch(':id')
  updateUser(
    @Request() req: { user: { companyId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.companyId, id, dto);
  }

  /** PATCH /users/:id/status — enable or disable a user account */
  @Patch(':id/status')
  setUserStatus(
    @Request() req: { user: { companyId: string } },
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.usersService.setUserStatus(req.user.companyId, id, dto.isActive);
  }
}
