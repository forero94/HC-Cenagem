import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(actorId: string | null, action: string, resource: string, resourceId?: string | null, metadata?: Prisma.InputJsonValue | null): Promise<void>;
}
