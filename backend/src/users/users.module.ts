import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// SupabaseModule is @Global — no need to import it here.
@Module({
  imports: [],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
