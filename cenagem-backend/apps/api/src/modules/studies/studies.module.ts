import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/database';
import { StudiesService } from './studies.service';
import { StudiesController } from './studies.controller';
import { FamilyStudiesController } from './family-studies.controller';

@Module({
  imports: [PrismaModule],
  providers: [StudiesService],
  controllers: [StudiesController, FamilyStudiesController],
  exports: [StudiesService],
})
export class StudiesModule {}
