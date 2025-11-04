import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { FamilyAttachmentDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';
export declare class FamilyAttachmentsService extends FamilyBaseService {
    private readonly mapper;
    constructor(prisma: PrismaService, mapper: FamilyMapper);
    listAttachments(familyId: string): Promise<FamilyAttachmentDto[]>;
    getAttachmentsForFamily(familyId: string, client: Prisma.TransactionClient): Promise<FamilyAttachmentDto[]>;
}
