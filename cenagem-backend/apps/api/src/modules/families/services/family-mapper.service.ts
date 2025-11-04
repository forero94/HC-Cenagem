import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  FamilyAttachmentDto,
  FamilyDetailDto,
  FamilyDto,
  FamilyEvolutionDto,
  FamilyMemberDto,
  FamilyMemberPreview,
  FamilyAppointmentDto,
  FamilyStudyDto,
} from '../families.types';

const familyMemberSelect = Prisma.validator<Prisma.FamilyMemberDefaultArgs>()({
  select: {
    id: true,
    familyId: true,
    role: true,
    initials: true,
    relationship: true,
    givenName: true,
    middleName: true,
    lastName: true,
    birthDate: true,
    sex: true,
    occupation: true,
    schoolingLevel: true,
    diagnosis: true,
    summary: true,
    contacto: true,
    filiatorios: true,
    antecedentes: true,
    notes: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
  },
});

const familyEvolutionSelect =
  Prisma.validator<Prisma.MemberEvolutionDefaultArgs>()({
    select: {
      id: true,
      familyId: true,
      memberId: true,
      authorName: true,
      authorEmail: true,
      note: true,
      recordedAt: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
  });

const familyAttachmentSelect = Prisma.validator<Prisma.AttachmentDefaultArgs>()(
  {
    select: {
      id: true,
      familyId: true,
      memberId: true,
      studyId: true,
      fileName: true,
      contentType: true,
      size: true,
      category: true,
      description: true,
      tags: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  },
);

const familyAppointmentSelect =
  Prisma.validator<Prisma.AppointmentDefaultArgs>()({
    select: {
      id: true,
      familyId: true,
      memberId: true,
      scheduledFor: true,
      durationMins: true,
      seatNumber: true,
      motive: true,
      notes: true,
      status: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

const familyStudySelect = Prisma.validator<Prisma.StudyDefaultArgs>()({
  select: {
    id: true,
    familyId: true,
    memberId: true,
    type: true,
    status: true,
    name: true,
    description: true,
    requestedAt: true,
    resultAt: true,
    notes: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
  },
});

const familyBaseFields = {
  id: true,
  code: true,
  status: true,
  displayName: true,
  province: true,
  city: true,
  address: true,
  tags: true,
  motiveGroup: true,
  motiveDetail: true,
  motiveNotes: true,
  motiveNarrative: true,
  motivePatient: true,
  motiveDerivation: true,
  contactInfo: true,
  consanguinity: true,
  obstetricHistory: true,
  grandparents: true,
  intake: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const;

const familyBaseSelect = Prisma.validator<Prisma.FamilyDefaultArgs>()({
  select: familyBaseFields,
});

const familyWithCountsSelect = Prisma.validator<Prisma.FamilyDefaultArgs>()({
  select: {
    ...familyBaseSelect.select,
    _count: {
      select: {
        members: true,
        appointments: true,
        studies: true,
        attachments: true,
        evolutions: true,
        uploadTickets: true,
      },
    },
  },
});

const familyWithMembersSelect = Prisma.validator<Prisma.FamilyDefaultArgs>()({
  select: {
    ...familyWithCountsSelect.select,
    members: {
      select: familyMemberSelect.select,
      orderBy: { createdAt: 'asc' },
    },
  },
});

type FamilyMemberEntity = Prisma.FamilyMemberGetPayload<
  typeof familyMemberSelect
>;
type FamilyEvolutionEntity = Prisma.MemberEvolutionGetPayload<
  typeof familyEvolutionSelect
>;
type FamilyAttachmentEntity = Prisma.AttachmentGetPayload<
  typeof familyAttachmentSelect
>;
type FamilyAppointmentEntity = Prisma.AppointmentGetPayload<
  typeof familyAppointmentSelect
>;
type FamilyStudyEntity = Prisma.StudyGetPayload<typeof familyStudySelect>;
type FamilyEntity = Prisma.FamilyGetPayload<typeof familyBaseSelect>;
type FamilyWithCountsEntity = Prisma.FamilyGetPayload<
  typeof familyWithCountsSelect
>;
type FamilyWithMembersEntity = Prisma.FamilyGetPayload<
  typeof familyWithMembersSelect
>;

interface MapFamilyOptions {
  previewMembers?: FamilyMemberDto[];
}

export {
  familyMemberSelect,
  familyEvolutionSelect,
  familyAttachmentSelect,
  familyAppointmentSelect,
  familyStudySelect,
  familyBaseSelect,
  familyWithCountsSelect,
  familyWithMembersSelect,
};

export type {
  FamilyMemberEntity,
  FamilyEvolutionEntity,
  FamilyAttachmentEntity,
  FamilyAppointmentEntity,
  FamilyStudyEntity,
  FamilyEntity,
  FamilyWithCountsEntity,
  FamilyWithMembersEntity,
};

interface MapFamilyDetailParams {
  family: FamilyWithCountsEntity;
  counts?: Prisma.FamilyCountOutputType;
  members: FamilyMemberDto[];
  evolutions: FamilyEvolutionDto[];
  attachments: FamilyAttachmentDto[];
  appointments: FamilyAppointmentDto[];
  studies: FamilyStudyDto[];
}

@Injectable()
export class FamilyMapper {
  mapFamily(
    family:
      | FamilyWithCountsEntity
      | (FamilyEntity & { _count?: Prisma.FamilyCountOutputType }),
    counts?: Prisma.FamilyCountOutputType,
    options: MapFamilyOptions = {},
  ): FamilyDto {
    const metadata = this.jsonFromDb(family.metadata);
    const intake = this.jsonFromDb(family.intake);

    const motive: FamilyDto['motive'] =
      family.motiveGroup ||
      family.motiveDetail ||
      family.motiveNotes ||
      metadata?.motiveGroupLabel ||
      metadata?.motiveDetailLabel
        ? {
            groupId: family.motiveGroup,
            groupLabel:
              typeof metadata?.motiveGroupLabel === 'string'
                ? metadata.motiveGroupLabel
                : null,
            detailId: family.motiveDetail,
            detailLabel:
              typeof metadata?.motiveDetailLabel === 'string'
                ? metadata.motiveDetailLabel
                : null,
            notes: family.motiveNotes,
          }
        : undefined;

    const membersPreview =
      options.previewMembers && options.previewMembers.length > 0
        ? options.previewMembers
            .map((member) => this.mapMemberPreview(member, intake))
            .filter((member): member is FamilyMemberPreview => member !== null)
        : undefined;

    return {
      id: family.id,
      code: family.code,
      status: family.status,
      displayName: family.displayName,
      province: family.province,
      city: family.city,
      address: family.address,
      tags: family.tags ?? [],
      motive,
      motiveNarrative: family.motiveNarrative,
      motivePatient: family.motivePatient,
      motiveDerivation: family.motiveDerivation,
      contactInfo: this.jsonFromDb(family.contactInfo),
      consanguinity: this.jsonFromDb(family.consanguinity),
      obstetricHistory: this.jsonFromDb(family.obstetricHistory),
      grandparents: this.jsonFromDb(family.grandparents),
      intake,
      metadata,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      counts: this.resolveCounts(family, counts),
      membersPreview,
    };
  }

  mapFamilyDetail(params: MapFamilyDetailParams): FamilyDetailDto {
    const base = this.mapFamily(params.family, params.counts, {
      previewMembers: params.members,
    });

    return {
      ...base,
      members: params.members,
      evolutions: params.evolutions,
      attachments: params.attachments,
      appointments: params.appointments,
      studies: params.studies,
    };
  }

  mapMember(member: FamilyMemberEntity): FamilyMemberDto {
    return {
      id: member.id,
      familyId: member.familyId,
      role: member.role,
      initials: member.initials,
      relationship: member.relationship,
      givenName: member.givenName,
      middleName: member.middleName,
      lastName: member.lastName,
      birthDate: member.birthDate ?? null,
      sex: member.sex ?? null,
      occupation: member.occupation,
      schoolingLevel: member.schoolingLevel,
      diagnosis: member.diagnosis,
      summary: member.summary,
      contacto: this.jsonFromDb(member.contacto),
      filiatorios: this.jsonFromDb(member.filiatorios),
      antecedentes: this.jsonFromDb(member.antecedentes),
      notes: this.jsonFromDb(member.notes),
      metadata: this.jsonFromDb(member.metadata),
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  mapEvolution(evolution: FamilyEvolutionEntity): FamilyEvolutionDto {
    return {
      id: evolution.id,
      familyId: evolution.familyId,
      memberId: evolution.memberId,
      authorName: evolution.authorName,
      authorEmail: evolution.authorEmail,
      note: evolution.note,
      recordedAt: evolution.recordedAt,
      createdAt: evolution.createdAt,
      updatedAt: evolution.updatedAt,
      metadata: this.jsonFromDb(evolution.metadata),
    };
  }

  mapAttachment(attachment: FamilyAttachmentEntity): FamilyAttachmentDto {
    return {
      id: attachment.id,
      familyId: attachment.familyId,
      memberId: attachment.memberId,
      studyId: attachment.studyId,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      category: attachment.category,
      description: attachment.description,
      tags: attachment.tags ?? [],
      metadata: this.jsonFromDb(attachment.metadata),
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }

  mapAppointment(appointment: FamilyAppointmentEntity): FamilyAppointmentDto {
    return {
      id: appointment.id,
      familyId: appointment.familyId ?? null,
      memberId: appointment.memberId ?? null,
      scheduledFor: appointment.scheduledFor,
      durationMins: appointment.durationMins,
      seatNumber: appointment.seatNumber,
      motive: appointment.motive,
      notes: appointment.notes,
      status: appointment.status,
      metadata: this.jsonFromDb(appointment.metadata),
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  mapStudy(study: FamilyStudyEntity): FamilyStudyDto {
    return {
      id: study.id,
      familyId: study.familyId,
      memberId: study.memberId,
      type: study.type,
      status: study.status,
      name: study.name,
      description: study.description,
      requestedAt: study.requestedAt ?? null,
      resultAt: study.resultAt ?? null,
      notes: study.notes,
      metadata: this.jsonFromDb(study.metadata),
      createdAt: study.createdAt,
      updatedAt: study.updatedAt,
    };
  }

  jsonFromDb(
    value: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  jsonInput(
    value?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  currentJson(
    value: Prisma.JsonValue | null | undefined,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private mapMemberPreview(
    member: FamilyMemberDto,
    intake?: Record<string, unknown> | null,
  ): FamilyMemberPreview | null {
    const filiatorios = member.filiatorios ?? null;
    const contacto = member.contacto ?? null;
    const metadata = member.metadata ?? null;

    const nameParts = [member.givenName, member.middleName, member.lastName]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    const filiatoriosNombreCompleto =
      typeof filiatorios?.['nombreCompleto'] === 'string'
        ? filiatorios['nombreCompleto'].trim()
        : '';

    const displayName = (
      nameParts.join(' ') ||
      filiatoriosNombreCompleto ||
      ''
    ).trim();

    const initialsFromFiliatorios =
      typeof filiatorios?.['iniciales'] === 'string'
        ? filiatorios['iniciales'].trim()
        : '';

    const initials =
      typeof member.initials === 'string' && member.initials.trim()
        ? member.initials.trim()
        : initialsFromFiliatorios || null;

    const documentNumber =
      this.extractDocumentNumber([metadata, filiatorios, contacto]) ??
      this.extractDocumentFromIntake(member, intake);

    return {
      id: member.id,
      role: member.role ?? member.relationship ?? null,
      initials,
      displayName: displayName || null,
      documentNumber: documentNumber ?? null,
    };
  }

  private extractDocumentNumber(
    sources: Array<Record<string, unknown> | null | undefined>,
  ): string | null {
    const keys = [
      'dni',
      'documento',
      'documentNumber',
      'docNumber',
      'numeroDocumento',
      'numero',
      'nroDocumento',
      'nro',
      'documentoNumero',
      'documentoIdentidad',
    ];

    for (const source of sources) {
      if (!source) continue;
      for (const key of keys) {
        const candidate = this.normalizeDocumentValue(source[key]);
        if (candidate) {
          return candidate;
        }
      }
    }

    return null;
  }

  private extractDocumentFromIntake(
    member: FamilyMemberDto,
    intake?: Record<string, unknown> | null,
  ): string | null {
    if (!intake) return null;
    const administrativoRaw = intake['administrativo'];
    if (
      !administrativoRaw ||
      typeof administrativoRaw !== 'object' ||
      Array.isArray(administrativoRaw)
    ) {
      return null;
    }

    const administrativo = administrativoRaw as Record<string, unknown>;
    const documentNumber = this.extractDocumentNumber([administrativo]);
    if (!documentNumber) {
      return null;
    }

    const role =
      typeof member.role === 'string' ? member.role.toLowerCase() : '';
    const initials =
      typeof member.initials === 'string'
        ? member.initials.trim().toUpperCase()
        : '';

    if (role === 'proband' || initials === 'A1') {
      return documentNumber;
    }

    return null;
  }

  private resolveCounts(
    family:
      | FamilyWithCountsEntity
      | (FamilyEntity & { _count?: Prisma.FamilyCountOutputType }),
    counts?: Prisma.FamilyCountOutputType,
  ): FamilyDto['counts'] {
    const resolved = counts ?? family._count;
    if (!resolved) {
      return undefined;
    }

    return {
      members: resolved.members,
      appointments: resolved.appointments,
      studies: resolved.studies,
      attachments: resolved.attachments,
      evolutions: resolved.evolutions,
      uploadTickets: resolved.uploadTickets ?? 0,
    };
  }

  private normalizeDocumentValue(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return null;
  }
}
