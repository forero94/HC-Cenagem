import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/database';
import { AuditModule } from '../audit/audit.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
