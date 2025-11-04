import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { FamilyMemberDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';

@Injectable()
export class FamilyMembersService extends FamilyBaseService {
  constructor(
    prisma: PrismaService,
    private readonly mapper: FamilyMapper,
  ) {
    super(prisma);
  }

  async listMembers(familyId: string): Promise<FamilyMemberDto[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureFamilyExists(tx, familyId);
      return this.getMembersForFamily(familyId, tx);
    });
  }

  async getMemberOrThrow(
    familyId: string,
    memberId: string,
  ): Promise<FamilyMemberDto> {
    return this.prisma.$transaction(async (tx) => {
      const member = await this.findMemberOrThrow(tx, familyId, memberId);
      return this.mapper.mapMember(member);
    });
  }

  async createMember(
    familyId: string,
    input: CreateMemberDto,
  ): Promise<FamilyMemberDto> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureFamilyExists(tx, familyId);

      const created = await tx.familyMember.create({
        data: {
          familyId,
          role: input.role.trim(),
          initials: input.initials?.trim() || null,
          relationship: input.relationship ?? null,
          givenName: input.givenName?.trim() || null,
          middleName: input.middleName?.trim() || null,
          lastName: input.lastName?.trim() || null,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          sex: input.sex ?? null,
          occupation: input.occupation?.trim() || null,
          schoolingLevel: input.schoolingLevel?.trim() || null,
          diagnosis: input.diagnosis?.trim() || null,
          summary: input.summary?.trim() || null,
          contacto: this.mapper.jsonInput(input.contacto),
          filiatorios: this.mapper.jsonInput(input.filiatorios),
          antecedentes: this.mapper.jsonInput(input.antecedentes),
          notes: this.mapper.jsonInput(input.notes),
          metadata: this.mapper.jsonInput(input.metadata),
        },
      });

      return this.mapper.mapMember(created);
    });
  }

  async updateMember(
    familyId: string,
    memberId: string,
    input: UpdateMemberDto,
  ): Promise<FamilyMemberDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findMemberOrThrow(tx, familyId, memberId);

      const updated = await tx.familyMember.update({
        where: { id: memberId },
        data: {
          role:
            input.role !== undefined
              ? input.role?.trim() || null
              : existing.role,
          initials:
            input.initials !== undefined
              ? input.initials?.trim() || null
              : existing.initials,
          relationship:
            input.relationship !== undefined
              ? (input.relationship ?? null)
              : existing.relationship,
          givenName:
            input.givenName !== undefined
              ? input.givenName?.trim() || null
              : existing.givenName,
          middleName:
            input.middleName !== undefined
              ? input.middleName?.trim() || null
              : existing.middleName,
          lastName:
            input.lastName !== undefined
              ? input.lastName?.trim() || null
              : existing.lastName,
          birthDate:
            input.birthDate !== undefined
              ? input.birthDate
                ? new Date(input.birthDate)
                : null
              : existing.birthDate,
          sex: input.sex ?? existing.sex,
          occupation:
            input.occupation !== undefined
              ? input.occupation?.trim() || null
              : existing.occupation,
          schoolingLevel:
            input.schoolingLevel !== undefined
              ? input.schoolingLevel?.trim() || null
              : existing.schoolingLevel,
          diagnosis:
            input.diagnosis !== undefined
              ? input.diagnosis?.trim() || null
              : existing.diagnosis,
          summary:
            input.summary !== undefined
              ? input.summary?.trim() || null
              : existing.summary,
          contacto:
            input.contacto !== undefined
              ? this.mapper.jsonInput(input.contacto)
              : this.mapper.currentJson(existing.contacto),
          filiatorios:
            input.filiatorios !== undefined
              ? this.mapper.jsonInput(input.filiatorios)
              : this.mapper.currentJson(existing.filiatorios),
          antecedentes:
            input.antecedentes !== undefined
              ? this.mapper.jsonInput(input.antecedentes)
              : this.mapper.currentJson(existing.antecedentes),
          notes:
            input.notes !== undefined
              ? this.mapper.jsonInput(input.notes)
              : this.mapper.currentJson(existing.notes),
          metadata:
            input.metadata !== undefined
              ? this.mapper.jsonInput(input.metadata)
              : this.mapper.currentJson(existing.metadata),
        },
      });

      return this.mapper.mapMember(updated);
    });
  }

  async deleteMember(familyId: string, memberId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const member = await this.findMemberOrThrow(tx, familyId, memberId);
      await tx.familyMember.delete({ where: { id: member.id } });
    });
  }

  async getMembersForFamily(
    familyId: string,
    client: Prisma.TransactionClient,
  ): Promise<FamilyMemberDto[]> {
    const members = await client.familyMember.findMany({
      where: { familyId },
      orderBy: [{ role: 'asc' }, { initials: 'asc' }, { createdAt: 'asc' }],
    });

    return members.map((member) => this.mapper.mapMember(member));
  }
}
