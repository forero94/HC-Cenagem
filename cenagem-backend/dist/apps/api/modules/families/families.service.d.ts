import { AppointmentStatus, AttachmentCategory, FamilyStatus, StudyStatus, StudyType } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { ListFamiliesQueryDto } from './dto/list-families.query';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateEvolutionDto } from './dto/create-evolution.dto';
import { ListEvolutionsQueryDto } from './dto/list-evolutions.query';
export interface FamilyCounts {
    members: number;
    appointments: number;
    studies: number;
    attachments: number;
    evolutions: number;
}
export interface FamilyMemberPreview {
    id: string;
    role?: string | null;
    initials?: string | null;
    displayName?: string | null;
    documentNumber?: string | null;
}
export interface FamilyDto {
    id: string;
    code: string;
    status: FamilyStatus;
    displayName?: string | null;
    province?: string | null;
    city?: string | null;
    address?: string | null;
    tags: string[];
    motive?: {
        groupId?: string | null;
        groupLabel?: string | null;
        detailId?: string | null;
        detailLabel?: string | null;
        notes?: string | null;
    };
    motiveNarrative?: string | null;
    motivePatient?: string | null;
    motiveDerivation?: string | null;
    contactInfo?: Record<string, unknown> | null;
    consanguinity?: Record<string, unknown> | null;
    obstetricHistory?: Record<string, unknown> | null;
    grandparents?: Record<string, unknown> | null;
    intake?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    counts?: FamilyCounts;
    membersPreview?: FamilyMemberPreview[];
}
export interface FamilyMemberDto {
    id: string;
    familyId: string;
    role?: string | null;
    initials?: string | null;
    relationship?: string | null;
    givenName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    birthDate?: Date | null;
    sex?: string | null;
    occupation?: string | null;
    schoolingLevel?: string | null;
    diagnosis?: string | null;
    summary?: string | null;
    contacto?: Record<string, unknown> | null;
    filiatorios?: Record<string, unknown> | null;
    antecedentes?: Record<string, unknown> | null;
    notes?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface FamilyEvolutionDto {
    id: string;
    familyId: string;
    memberId: string;
    authorName?: string | null;
    authorEmail?: string | null;
    note: string;
    recordedAt: Date;
    metadata?: Record<string, unknown> | null;
}
export interface FamilyDetailDto extends FamilyDto {
    members: FamilyMemberDto[];
    evolutions: FamilyEvolutionDto[];
    appointments: {
        id: string;
        familyId?: string | null;
        memberId?: string | null;
        scheduledFor: Date;
        durationMins?: number | null;
        seatNumber?: number | null;
        motive?: string | null;
        notes?: string | null;
        status: AppointmentStatus;
        metadata?: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    }[];
    studies: {
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
    }[];
    attachments: {
        id: string;
        familyId: string;
        memberId?: string | null;
        studyId?: string | null;
        fileName: string;
        contentType?: string | null;
        size?: number | null;
        category: AttachmentCategory;
        description?: string | null;
        tags: string[];
        metadata?: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date;
    }[];
}
export declare class FamiliesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listFamilies(query: ListFamiliesQueryDto): Promise<{
        data: FamilyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createFamily(input: CreateFamilyDto): Promise<FamilyDetailDto>;
    getFamilyOrThrow(familyId: string): Promise<FamilyDetailDto>;
    updateFamily(familyId: string, input: UpdateFamilyDto): Promise<FamilyDetailDto>;
    listMembers(familyId: string): Promise<FamilyMemberDto[]>;
    getMemberOrThrow(familyId: string, memberId: string): Promise<FamilyMemberDto>;
    createMember(familyId: string, input: CreateMemberDto): Promise<FamilyMemberDto>;
    updateMember(familyId: string, memberId: string, input: UpdateMemberDto): Promise<FamilyMemberDto>;
    deleteMember(familyId: string, memberId: string): Promise<void>;
    listEvolutions(familyId: string, query: ListEvolutionsQueryDto): Promise<{
        data: FamilyEvolutionDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createEvolution(familyId: string, memberId: string, input: CreateEvolutionDto): Promise<FamilyEvolutionDto>;
    private mapFamily;
    private mapFamilyDetail;
    private mapMemberPreview;
    private extractDocumentNumber;
    private extractDocumentFromIntake;
    private normalizeDocumentValue;
    private mapMember;
    private mapEvolution;
    private composeMetadata;
    private jsonFromDb;
    private jsonInput;
    private currentJson;
    private assertFamilyExists;
    private handlePrismaError;
    private prismaErrorTargets;
}
