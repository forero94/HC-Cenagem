import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@infrastructure/database';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { FamilyAttachmentsController } from './family-attachments.controller';
import { UploadTicketsService } from './upload-tickets.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [AttachmentsService, UploadTicketsService],
  controllers: [AttachmentsController, FamilyAttachmentsController],
  exports: [AttachmentsService, UploadTicketsService],
})
export class AttachmentsModule {}
