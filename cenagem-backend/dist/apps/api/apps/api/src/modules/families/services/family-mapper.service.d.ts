import { Prisma } from '@prisma/client';
import { FamilyAttachmentDto, FamilyDetailDto, FamilyDto, FamilyEvolutionDto, FamilyMemberDto, FamilyAppointmentDto, FamilyStudyDto } from '../families.types';
declare const familyMemberSelect: {
    select: {
        id: true;
        familyId: true;
        role: true;
        initials: true;
        relationship: true;
        givenName: true;
        middleName: true;
        lastName: true;
        birthDate: true;
        sex: true;
        occupation: true;
        schoolingLevel: true;
        diagnosis: true;
        summary: true;
        contacto: true;
        filiatorios: true;
        antecedentes: true;
        notes: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
declare const familyEvolutionSelect: {
    select: {
        id: true;
        familyId: true;
        memberId: true;
        authorName: true;
        authorEmail: true;
        note: true;
        recordedAt: true;
        createdAt: true;
        updatedAt: true;
        metadata: true;
    };
};
declare const familyAttachmentSelect: {
    select: {
        id: true;
        familyId: true;
        memberId: true;
        studyId: true;
        fileName: true;
        contentType: true;
        size: true;
        category: true;
        description: true;
        tags: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
declare const familyAppointmentSelect: {
    select: {
        id: true;
        familyId: true;
        memberId: true;
        scheduledFor: true;
        durationMins: true;
        seatNumber: true;
        motive: true;
        notes: true;
        status: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
declare const familyStudySelect: {
    select: {
        id: true;
        familyId: true;
        memberId: true;
        type: true;
        status: true;
        name: true;
        description: true;
        requestedAt: true;
        resultAt: true;
        notes: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
declare const familyBaseSelect: {
    select: {
        readonly id: true;
        readonly code: true;
        readonly status: true;
        readonly displayName: true;
        readonly province: true;
        readonly city: true;
        readonly address: true;
        readonly tags: true;
        readonly motiveGroup: true;
        readonly motiveDetail: true;
        readonly motiveNotes: true;
        readonly motiveNarrative: true;
        readonly motivePatient: true;
        readonly motiveDerivation: true;
        readonly contactInfo: true;
        readonly consanguinity: true;
        readonly obstetricHistory: true;
        readonly grandparents: true;
        readonly intake: true;
        readonly metadata: true;
        readonly createdAt: true;
        readonly updatedAt: true;
    };
};
declare const familyWithCountsSelect: {
    select: {
        _count: {
            select: {
                members: true;
                appointments: true;
                studies: true;
                attachments: true;
                evolutions: true;
                uploadTickets: true;
            };
        };
        id: true;
        code: true;
        status: true;
        displayName: true;
        province: true;
        city: true;
        address: true;
        tags: true;
        motiveGroup: true;
        motiveDetail: true;
        motiveNotes: true;
        motiveNarrative: true;
        motivePatient: true;
        motiveDerivation: true;
        contactInfo: true;
        consanguinity: true;
        obstetricHistory: true;
        grandparents: true;
        intake: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
declare const familyWithMembersSelect: {
    select: {
        members: {
            select: {
                id: true;
                familyId: true;
                role: true;
                initials: true;
                relationship: true;
                givenName: true;
                middleName: true;
                lastName: true;
                birthDate: true;
                sex: true;
                occupation: true;
                schoolingLevel: true;
                diagnosis: true;
                summary: true;
                contacto: true;
                filiatorios: true;
                antecedentes: true;
                notes: true;
                metadata: true;
                createdAt: true;
                updatedAt: true;
            };
            orderBy: {
                createdAt: "asc";
            };
        };
        _count: {
            select: {
                members: true;
                appointments: true;
                studies: true;
                attachments: true;
                evolutions: true;
                uploadTickets: true;
            };
        };
        id: true;
        code: true;
        status: true;
        displayName: true;
        province: true;
        city: true;
        address: true;
        tags: true;
        motiveGroup: true;
        motiveDetail: true;
        motiveNotes: true;
        motiveNarrative: true;
        motivePatient: true;
        motiveDerivation: true;
        contactInfo: true;
        consanguinity: true;
        obstetricHistory: true;
        grandparents: true;
        intake: true;
        metadata: true;
        createdAt: true;
        updatedAt: true;
    };
};
type FamilyMemberEntity = Prisma.FamilyMemberGetPayload<typeof familyMemberSelect>;
type FamilyEvolutionEntity = Prisma.MemberEvolutionGetPayload<typeof familyEvolutionSelect>;
type FamilyAttachmentEntity = Prisma.AttachmentGetPayload<typeof familyAttachmentSelect>;
type FamilyAppointmentEntity = Prisma.AppointmentGetPayload<typeof familyAppointmentSelect>;
type FamilyStudyEntity = Prisma.StudyGetPayload<typeof familyStudySelect>;
type FamilyEntity = Prisma.FamilyGetPayload<typeof familyBaseSelect>;
type FamilyWithCountsEntity = Prisma.FamilyGetPayload<typeof familyWithCountsSelect>;
type FamilyWithMembersEntity = Prisma.FamilyGetPayload<typeof familyWithMembersSelect>;
interface MapFamilyOptions {
    previewMembers?: FamilyMemberDto[];
}
export { familyMemberSelect, familyEvolutionSelect, familyAttachmentSelect, familyAppointmentSelect, familyStudySelect, familyBaseSelect, familyWithCountsSelect, familyWithMembersSelect, };
export type { FamilyMemberEntity, FamilyEvolutionEntity, FamilyAttachmentEntity, FamilyAppointmentEntity, FamilyStudyEntity, FamilyEntity, FamilyWithCountsEntity, FamilyWithMembersEntity, };
interface MapFamilyDetailParams {
    family: FamilyWithCountsEntity;
    counts?: Prisma.FamilyCountOutputType;
    members: FamilyMemberDto[];
    evolutions: FamilyEvolutionDto[];
    attachments: FamilyAttachmentDto[];
    appointments: FamilyAppointmentDto[];
    studies: FamilyStudyDto[];
}
export declare class FamilyMapper {
    mapFamily(family: FamilyWithCountsEntity | (FamilyEntity & {
        _count?: Prisma.FamilyCountOutputType;
    }), counts?: Prisma.FamilyCountOutputType, options?: MapFamilyOptions): FamilyDto;
    mapFamilyDetail(params: MapFamilyDetailParams): FamilyDetailDto;
    mapMember(member: FamilyMemberEntity): FamilyMemberDto;
    mapEvolution(evolution: FamilyEvolutionEntity): FamilyEvolutionDto;
    mapAttachment(attachment: FamilyAttachmentEntity): FamilyAttachmentDto;
    mapAppointment(appointment: FamilyAppointmentEntity): FamilyAppointmentDto;
    mapStudy(study: FamilyStudyEntity): FamilyStudyDto;
    jsonFromDb(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null;
    jsonInput(value?: Record<string, unknown> | null): Prisma.InputJsonValue | Prisma.JsonNullValueInput;
    currentJson(value: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue | Prisma.JsonNullValueInput;
    private mapMemberPreview;
    private extractDocumentNumber;
    private extractDocumentFromIntake;
    private resolveCounts;
    private normalizeDocumentValue;
}
