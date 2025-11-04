import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FamilyStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@infrastructure/database';
import { CreateFamilyDto } from '../dto/create-family.dto';
import { UpdateFamilyDto } from '../dto/update-family.dto';
import { ListFamiliesQueryDto } from '../dto/list-families.query';
import {
  FamilyDetailDto,
  FamilyDto,
  FamilyMemberDto,
  FamilyEvolutionDto,
  FamilyAttachmentDto,
  FamilyAppointmentDto,
  FamilyStudyDto,
} from '../families.types';
import {
  FamilyMapper,
  FamilyWithCountsEntity,
  FamilyWithMembersEntity,
  familyWithCountsSelect,
  familyWithMembersSelect,
  familyAppointmentSelect,
  familyStudySelect,
} from './family-mapper.service';
import { FamilyMembersService } from './family-members.service';
import { FamilyEvolutionsService } from './family-evolutions.service';
import { FamilyAttachmentsService } from './family-attachments.service';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: FamilyMapper,
    private readonly membersService: FamilyMembersService,
    private readonly evolutionsService: FamilyEvolutionsService,
    private readonly attachmentsService: FamilyAttachmentsService,
  ) {}

  async listFamilies(
    query: ListFamiliesQueryDto,
  ): Promise<{ data: FamilyDto[]; meta: { nextCursor?: string } }> {
    const take = query.limit ?? 25;

    const where: Prisma.FamilyWhereInput = {};
    const includeMembers = Boolean(query.withMembers);

    if (query.status) {
      where.status = query.status;
    }

    if (query.province) {
      where.province = { equals: query.province, mode: 'insensitive' };
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      const memberConditions: Prisma.FamilyMemberWhereInput[] = [
        { givenName: { contains: searchTerm, mode: 'insensitive' } },
        { middleName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { initials: { contains: searchTerm, mode: 'insensitive' } },
        { relationship: { contains: searchTerm, mode: 'insensitive' } },
      ];

      const digitCandidates = Array.from(
        new Set(
          [searchTerm, searchTerm.replace(/\D+/g, '')]
            .map((candidate) => candidate.trim())
            .filter(Boolean),
        ),
      );

      if (digitCandidates.length > 0) {
        digitCandidates.forEach((candidate) => {
          memberConditions.push(
            {
              metadata: {
                path: ['dni'],
                string_contains: candidate,
              },
            },
            {
              metadata: {
                path: ['documentNumber'],
                string_contains: candidate,
              },
            },
            {
              filiatorios: {
                path: ['dni'],
                string_contains: candidate,
              },
            },
            {
              filiatorios: {
                path: ['documento'],
                string_contains: candidate,
              },
            },
          );
        });
      }

      where.OR = [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { displayName: { contains: searchTerm, mode: 'insensitive' } },
        { members: { some: { OR: memberConditions } } },
      ];
    }

    const families = (await this.prisma.family.findMany({
      where,
      take: take + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: includeMembers
        ? familyWithMembersSelect.select
        : familyWithCountsSelect.select,
    })) as (FamilyWithCountsEntity | FamilyWithMembersEntity)[];

    let nextCursor: string | undefined;
    if (families.length > take) {
      const next = families.pop();
      nextCursor = next?.id;
    }

    const data = families.map((family) => {
      const previewMembers: FamilyMemberDto[] | undefined =
        'members' in family && Array.isArray(family.members)
          ? family.members.map((member) => this.mapper.mapMember(member))
          : undefined;

      return this.mapper.mapFamily(family, family._count, {
        previewMembers,
      });
    });

    return { data, meta: { nextCursor } };
  }

  async createFamily(input: CreateFamilyDto): Promise<FamilyDetailDto> {
    const tags = input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
    const metadata = this.composeMetadata(input);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.family.create({
          data: {
            code: input.code.trim().toUpperCase(),
            displayName: input.displayName?.trim() || null,
            status: input.status ?? FamilyStatus.ACTIVE,
            province: input.province?.trim() || null,
            city: input.city?.trim() || null,
            address: input.address?.trim() || null,
            tags,
            motiveGroup: input.motive?.groupId?.trim() || null,
            motiveDetail: input.motive?.detailId?.trim() || null,
            motiveNotes: input.motive?.motiveNotes?.trim() || null,
            motiveNarrative: input.motiveNarrative?.trim() || null,
            motivePatient: input.motivePatient?.trim() || null,
            motiveDerivation: input.motiveDerivation?.trim() || null,
            contactInfo: this.mapper.jsonInput(input.contactInfo),
            consanguinity: this.mapper.jsonInput(input.consanguinity),
            obstetricHistory: this.mapper.jsonInput(input.obstetricHistory),
            grandparents: this.mapper.jsonInput(input.grandparents),
            intake: this.mapper.jsonInput(input.intake),
            metadata,
          },
        });

        const family = await this.loadFamilyOrThrow(created.id, tx);
        return this.buildFamilyDetail(family, tx);
      });
    } catch (error) {
      this.handlePrismaError(error, input.code);
    }
  }

  async getFamilyOrThrow(familyId: string): Promise<FamilyDetailDto> {
    return this.prisma.$transaction(async (tx) => {
      const family = await this.loadFamilyOrThrow(familyId, tx);
      return this.buildFamilyDetail(family, tx);
    });
  }

  async updateFamily(
    familyId: string,
    input: UpdateFamilyDto,
  ): Promise<FamilyDetailDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const family = await tx.family.findUnique({
          where: { id: familyId },
        });

        if (!family) {
          throw new NotFoundException('Familia no encontrada');
        }

        const tags =
          input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? family.tags;

        const metadata = this.composeMetadata(
          input,
          this.mapper.jsonFromDb(family.metadata),
        );

        await tx.family.update({
          where: { id: familyId },
          data: {
            code: input.code
              ? input.code.trim().toUpperCase()
              : family.code.toUpperCase(),
            displayName:
              input.displayName !== undefined
                ? input.displayName?.trim() || null
                : family.displayName,
            status: input.status ?? family.status,
            province:
              input.province !== undefined
                ? input.province?.trim() || null
                : family.province,
            city:
              input.city !== undefined
                ? input.city?.trim() || null
                : family.city,
            address:
              input.address !== undefined
                ? input.address?.trim() || null
                : family.address,
            tags,
            motiveGroup:
              input.motive?.groupId !== undefined
                ? input.motive?.groupId?.trim() || null
                : family.motiveGroup,
            motiveDetail:
              input.motive?.detailId !== undefined
                ? input.motive?.detailId?.trim() || null
                : family.motiveDetail,
            motiveNotes:
              input.motive?.motiveNotes !== undefined
                ? input.motive?.motiveNotes?.trim() || null
                : family.motiveNotes,
            motiveNarrative:
              input.motiveNarrative !== undefined
                ? input.motiveNarrative?.trim() || null
                : family.motiveNarrative,
            motivePatient:
              input.motivePatient !== undefined
                ? input.motivePatient?.trim() || null
                : family.motivePatient,
            motiveDerivation:
              input.motiveDerivation !== undefined
                ? input.motiveDerivation?.trim() || null
                : family.motiveDerivation,
            contactInfo:
              input.contactInfo !== undefined
                ? this.mapper.jsonInput(input.contactInfo)
                : this.mapper.currentJson(family.contactInfo),
            consanguinity:
              input.consanguinity !== undefined
                ? this.mapper.jsonInput(input.consanguinity)
                : this.mapper.currentJson(family.consanguinity),
            obstetricHistory:
              input.obstetricHistory !== undefined
                ? this.mapper.jsonInput(input.obstetricHistory)
                : this.mapper.currentJson(family.obstetricHistory),
            grandparents:
              input.grandparents !== undefined
                ? this.mapper.jsonInput(input.grandparents)
                : this.mapper.currentJson(family.grandparents),
            intake:
              input.intake !== undefined
                ? this.mapper.jsonInput(input.intake)
                : this.mapper.currentJson(family.intake),
            metadata,
          },
        });

        const reloaded = await this.loadFamilyOrThrow(familyId, tx);
        return this.buildFamilyDetail(reloaded, tx);
      });
    } catch (error) {
      this.handlePrismaError(error, input.code);
    }
  }

  private async loadFamilyOrThrow(
    familyId: string,
    client: Prisma.TransactionClient,
  ): Promise<FamilyWithCountsEntity> {
    const family = await client.family.findUnique({
      where: { id: familyId },
      select: familyWithCountsSelect.select,
    });

    if (!family) {
      throw new NotFoundException('Familia no encontrada');
    }

    return family;
  }

  private async buildFamilyDetail(
    family: FamilyWithCountsEntity,
    client: Prisma.TransactionClient,
  ): Promise<FamilyDetailDto> {
    const [members, evolutions, attachments, appointments, studies] =
      await Promise.all([
        this.membersService.getMembersForFamily(family.id, client),
        this.evolutionsService.getEvolutionsForFamily(family.id, client),
        this.attachmentsService.getAttachmentsForFamily(family.id, client),
        client.appointment
          .findMany({
            where: { familyId: family.id },
            orderBy: { scheduledFor: 'desc' },
            select: familyAppointmentSelect.select,
          })
          .then((items) =>
            items.map((item) => this.mapper.mapAppointment(item)),
          ),
        client.study
          .findMany({
            where: { familyId: family.id },
            orderBy: { createdAt: 'desc' },
            select: familyStudySelect.select,
          })
          .then((items) => items.map((item) => this.mapper.mapStudy(item))),
      ]);

    return this.mapper.mapFamilyDetail({
      family,
      counts: family._count,
      members,
      evolutions,
      attachments,
      appointments,
      studies,
    });
  }

  private composeMetadata(
    input: CreateFamilyDto | UpdateFamilyDto,
    existing?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    const metadata = { ...(existing ?? {}) };

    if (input.metadata) {
      Object.assign(metadata, input.metadata);
    }

    if (input.motive?.groupLabel !== undefined) {
      metadata.motiveGroupLabel = input.motive.groupLabel ?? null;
    }

    if (input.motive?.detailLabel !== undefined) {
      metadata.motiveDetailLabel = input.motive.detailLabel ?? null;
    }

    return Object.keys(metadata).length > 0
      ? (metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull;
  }

  private handlePrismaError(error: unknown, code?: string): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (
        error.code === 'P2002' &&
        this.prismaErrorTargets(error).some((target) =>
          String(target).toLowerCase().includes('code'),
        )
      ) {
        const formattedCode = code ? `'${code}'` : 'indicado';
        throw new ConflictException(
          `Ya existe una historia clínica con el código ${formattedCode}.`,
        );
      }
    }
    throw error;
  }

  private prismaErrorTargets(error: PrismaClientKnownRequestError): string[] {
    const target = error.meta?.target;
    if (!target) {
      return [];
    }
    if (Array.isArray(target)) {
      return target.filter((item): item is string => typeof item === 'string');
    }
    if (typeof target === 'string') {
      return [target];
    }
    if (typeof target === 'number' || typeof target === 'boolean') {
      return [String(target)];
    }
    return [];
  }
}

export type {
  FamilyDto,
  FamilyDetailDto,
  FamilyMemberDto,
  FamilyEvolutionDto,
  FamilyAttachmentDto,
  FamilyAppointmentDto,
  FamilyStudyDto,
};
