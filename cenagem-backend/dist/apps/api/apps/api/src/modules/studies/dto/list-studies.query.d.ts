import { StudyStatus, StudyType } from '@prisma/client';
export declare class ListStudiesQueryDto {
    familyId?: string;
    memberId?: string;
    type?: StudyType;
    status?: StudyStatus;
    limit: number;
    cursor?: string;
}
