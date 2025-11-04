import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/database';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './services/families.service';
import { FamilyMembersService } from './services/family-members.service';
import { FamilyEvolutionsService } from './services/family-evolutions.service';
import { FamilyAttachmentsService } from './services/family-attachments.service';
import { FamilyMapper } from './services/family-mapper.service';

@Module({
  imports: [PrismaModule],
  controllers: [FamiliesController],
  providers: [
    FamilyMapper,
    FamilyAttachmentsService,
    FamilyMembersService,
    FamilyEvolutionsService,
    FamiliesService,
  ],
  exports: [
    FamiliesService,
    FamilyMembersService,
    FamilyEvolutionsService,
    FamilyAttachmentsService,
  ],
})
export class FamiliesModule {}
