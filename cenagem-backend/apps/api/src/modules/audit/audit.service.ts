import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    actorId: string | null,
    action: string,
    resource: string,
    resourceId?: string | null,
    metadata?: Prisma.InputJsonValue | null,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action,
          resource,
          resourceId,
          metadata: metadata ?? undefined,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Unable to persist audit log for action "${action}" on "${resource}": ${error}`,
      );
    }
  }
}
