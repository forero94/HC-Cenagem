import { AttachmentCategory } from '@prisma/client';
export declare class CreateAttachmentDto {
    familyId?: string;
    memberId?: string;
    studyId?: string;
    fileName: string;
    contentType?: string;
    category?: AttachmentCategory;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    base64Data: string;
}
