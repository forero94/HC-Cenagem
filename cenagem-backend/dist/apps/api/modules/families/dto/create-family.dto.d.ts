import { FamilyStatus } from '@prisma/client';
declare class FamilyMotiveDto {
    groupId?: string;
    groupLabel?: string;
    detailId?: string;
    detailLabel?: string;
    motiveNotes?: string;
}
export declare class CreateFamilyDto {
    code: string;
    displayName?: string;
    status?: FamilyStatus;
    province?: string;
    city?: string;
    address?: string;
    tags?: string[];
    motive?: FamilyMotiveDto;
    motiveNarrative?: string;
    motivePatient?: string;
    motiveDerivation?: string;
    contactInfo?: Record<string, unknown>;
    consanguinity?: Record<string, unknown>;
    obstetricHistory?: Record<string, unknown>;
    grandparents?: Record<string, unknown>;
    intake?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export {};
