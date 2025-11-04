import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import {
  FamilyMemberEntity,
  familyMemberSelect,
} from './family-mapper.service';

export abstract class FamilyBaseService {
  protected constructor(protected readonly prisma: PrismaService) {}

  protected async ensureFamilyExists(
    client: Prisma.TransactionClient,
    familyId: string,
  ): Promise<void> {
    const exists = await client.family.findUnique({
      where: { id: familyId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Familia no encontrada');
    }
  }

  protected async findMemberOrThrow(
    client: Prisma.TransactionClient,
    familyId: string,
    memberId: string,
  ): Promise<FamilyMemberEntity> {
    const member = await client.familyMember.findUnique({
      where: { id: memberId },
      select: familyMemberSelect.select,
    });

    if (!member || member.familyId !== familyId) {
      throw new NotFoundException('Miembro no encontrado en la familia');
    }

    return member;
  }
}
