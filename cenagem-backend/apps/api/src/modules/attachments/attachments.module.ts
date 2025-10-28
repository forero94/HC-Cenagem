import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/database';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { FamilyAttachmentsController } from './family-attachments.controller';

@Module({
  imports: [PrismaModule],
  providers: [AttachmentsService],
  controllers: [AttachmentsController, FamilyAttachmentsController],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
