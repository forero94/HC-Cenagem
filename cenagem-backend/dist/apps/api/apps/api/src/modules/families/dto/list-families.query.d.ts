import { FamilyStatus } from '@prisma/client';
export declare class ListFamiliesQueryDto {
    search?: string;
    status?: FamilyStatus;
    province?: string;
    withMembers?: boolean;
    limit: number;
    cursor?: string;
}
