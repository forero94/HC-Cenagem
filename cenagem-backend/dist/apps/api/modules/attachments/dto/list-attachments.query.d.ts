import { AttachmentCategory } from '@prisma/client';
export declare class ListAttachmentsQueryDto {
    familyId?: string;
    memberId?: string;
    studyId?: string;
    category?: AttachmentCategory;
    tags?: string[];
    limit: number;
    cursor?: string;
}
