import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateEvolutionDto } from '../dto/create-evolution.dto';
import { ListEvolutionsQueryDto } from '../dto/list-evolutions.query';
import { FamilyEvolutionDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';

@Injectable()
export class FamilyEvolutionsService extends FamilyBaseService {
  constructor(
    prisma: PrismaService,
    private readonly mapper: FamilyMapper,
  ) {
    super(prisma);
  }

  async listEvolutions(
    familyId: string,
    query: ListEvolutionsQueryDto,
  ): Promise<{ data: FamilyEvolutionDto[]; meta: { nextCursor?: string } }> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureFamilyExists(tx, familyId);

      const take = query.limit ?? 50;
      const where: Prisma.MemberEvolutionWhereInput = {
        familyId,
        ...(query.memberId ? { memberId: query.memberId } : {}),
      };

      const evolutions = await tx.memberEvolution.findMany({
        where,
        take: take + 1,
        skip: query.cursor ? 1 : 0,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy: { recordedAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (evolutions.length > take) {
        const next = evolutions.pop();
        nextCursor = next?.id;
      }

      return {
        data: evolutions.map((item) => this.mapper.mapEvolution(item)),
        meta: { nextCursor },
      };
    });
  }

  async createEvolution(
    familyId: string,
    memberId: string,
    input: CreateEvolutionDto,
  ): Promise<FamilyEvolutionDto> {
    return this.prisma.$transaction(async (tx) => {
      await this.findMemberOrThrow(tx, familyId, memberId);

      const recordedAt = input.recordedAt
        ? new Date(input.recordedAt)
        : new Date();

      const created = await tx.memberEvolution.create({
        data: {
          familyId,
          memberId,
          authorName: input.authorName?.trim() || null,
          authorEmail: input.authorEmail?.trim().toLowerCase() || null,
          note: input.note.trim(),
          recordedAt,
        },
      });

      return this.mapper.mapEvolution(created);
    });
  }

  async getEvolutionsForFamily(
    familyId: string,
    client: Prisma.TransactionClient,
  ): Promise<FamilyEvolutionDto[]> {
    const evolutions = await client.memberEvolution.findMany({
      where: { familyId },
      orderBy: { recordedAt: 'desc' },
    });

    return evolutions.map((item) => this.mapper.mapEvolution(item));
  }
}
