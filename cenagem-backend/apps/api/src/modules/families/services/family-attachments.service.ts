import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { FamilyAttachmentDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';

@Injectable()
export class FamilyAttachmentsService extends FamilyBaseService {
  constructor(
    prisma: PrismaService,
    private readonly mapper: FamilyMapper,
  ) {
    super(prisma);
  }

  async listAttachments(familyId: string): Promise<FamilyAttachmentDto[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureFamilyExists(tx, familyId);
      return this.getAttachmentsForFamily(familyId, tx);
    });
  }

  async getAttachmentsForFamily(
    familyId: string,
    client: Prisma.TransactionClient,
  ): Promise<FamilyAttachmentDto[]> {
    const attachments = await client.attachment.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map((attachment) =>
      this.mapper.mapAttachment(attachment),
    );
  }
}
