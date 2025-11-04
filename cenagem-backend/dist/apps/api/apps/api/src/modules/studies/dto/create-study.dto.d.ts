import { StudyStatus, StudyType } from '@prisma/client';
export declare class CreateStudyDto {
    familyId?: string;
    memberId?: string;
    type: StudyType;
    name: string;
    description?: string;
    status?: StudyStatus;
    requestedAt?: string;
    resultAt?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
}
