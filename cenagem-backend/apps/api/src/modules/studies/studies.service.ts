import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Study, StudyStatus, StudyType } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { ListStudiesQueryDto } from './dto/list-studies.query';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';

export interface StudyDto {
  id: string;
  familyId: string;
  memberId?: string | null;
  type: StudyType;
  status: StudyStatus;
  name: string;
  description?: string | null;
  requestedAt?: Date | null;
  resultAt?: Date | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listStudies(
    query: ListStudiesQueryDto,
  ): Promise<{ data: StudyDto[]; meta: { nextCursor?: string } }> {
    const where = this.buildWhere(query);
    const take = query.limit ?? 50;

    const studies = await this.prisma.study.findMany({
      where,
      take: take + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined;
    if (studies.length > take) {
      const next = studies.pop();
      nextCursor = next?.id;
    }

    return {
      data: studies.map((study: Study) => this.mapStudy(study)),
      meta: { nextCursor },
    };
  }

  async listForFamily(
    familyId: string,
    query: ListStudiesQueryDto,
  ): Promise<{ data: StudyDto[]; meta: { nextCursor?: string } }> {
    return this.listStudies({ ...query, familyId });
  }

  async getById(studyId: string): Promise<StudyDto> {
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      throw new NotFoundException('Estudio no encontrado');
    }

    return this.mapStudy(study);
  }

  async createForFamily(
    familyId: string,
    input: CreateStudyDto,
  ): Promise<StudyDto> {
    await this.assertFamilyExists(familyId);

    let memberId: string | null = null;
    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });
      if (!member || member.familyId !== familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
      }
      memberId = member.id;
    }

    const created = await this.prisma.study.create({
      data: {
        familyId,
        memberId,
        type: input.type,
        status: input.status ?? StudyStatus.REQUESTED,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        requestedAt: input.requestedAt ? new Date(input.requestedAt) : null,
        resultAt: input.resultAt ? new Date(input.resultAt) : null,
        notes: input.notes?.trim() || null,
        metadata: this.jsonInput(input.metadata),
      },
    });

    return this.mapStudy(created);
  }

  async create(input: CreateStudyDto): Promise<StudyDto> {
    if (!input.familyId) {
      throw new NotFoundException(
        'Debe especificarse la familia para registrar el estudio',
      );
    }
    return this.createForFamily(input.familyId, input);
  }

  async update(studyId: string, input: UpdateStudyDto): Promise<StudyDto> {
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      throw new NotFoundException('Estudio no encontrado');
    }

    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });
      if (!member || member.familyId !== study.familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
      }
    }

    const updated = await this.prisma.study.update({
      where: { id: studyId },
      data: {
        memberId:
          input.memberId !== undefined
            ? (input.memberId ?? null)
            : study.memberId,
        type: input.type ?? study.type,
        status: input.status ?? study.status,
        name: input.name !== undefined ? input.name.trim() : study.name,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : study.description,
        requestedAt:
          input.requestedAt !== undefined
            ? input.requestedAt
              ? new Date(input.requestedAt)
              : null
            : study.requestedAt,
        resultAt:
          input.resultAt !== undefined
            ? input.resultAt
              ? new Date(input.resultAt)
              : null
            : study.resultAt,
        notes:
          input.notes !== undefined ? input.notes?.trim() || null : study.notes,
        metadata:
          input.metadata !== undefined
            ? this.jsonInput(input.metadata)
            : this.currentJson(study.metadata),
      },
    });

    return this.mapStudy(updated);
  }

  async remove(studyId: string): Promise<void> {
    const exists = await this.prisma.study.findUnique({
      where: { id: studyId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Estudio no encontrado');
    }

    await this.prisma.study.delete({
      where: { id: studyId },
    });
  }

  private mapStudy(study: Study): StudyDto {
    return {
      id: study.id,
      familyId: study.familyId,
      memberId: study.memberId,
      type: study.type,
      status: study.status,
      name: study.name,
      description: study.description,
      requestedAt: study.requestedAt ?? undefined,
      resultAt: study.resultAt ?? undefined,
      notes: study.notes,
      metadata: this.jsonFromDb(study.metadata),
      createdAt: study.createdAt,
      updatedAt: study.updatedAt,
    };
  }

  private buildWhere(query: ListStudiesQueryDto): Prisma.StudyWhereInput {
    const where: Prisma.StudyWhereInput = {};

    if (query.familyId) {
      where.familyId = query.familyId;
    }

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private jsonFromDb(
    value: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private jsonInput(
    value?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private currentJson(
    value: Prisma.JsonValue | null | undefined,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private async assertFamilyExists(familyId: string): Promise<void> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true },
    });

    if (!family) {
      throw new NotFoundException('Familia no encontrada');
    }
  }
}
