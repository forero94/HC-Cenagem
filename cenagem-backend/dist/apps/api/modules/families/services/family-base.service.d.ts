import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { FamilyMemberEntity } from './family-mapper.service';
export declare abstract class FamilyBaseService {
    protected readonly prisma: PrismaService;
    protected constructor(prisma: PrismaService);
    protected ensureFamilyExists(client: Prisma.TransactionClient, familyId: string): Promise<void>;
    protected findMemberOrThrow(client: Prisma.TransactionClient, familyId: string, memberId: string): Promise<FamilyMemberEntity>;
}
