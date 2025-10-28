import { AttachmentCategory } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
export interface AttachmentDto {
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
}
export interface AttachmentDetailDto extends AttachmentDto {
    base64Data?: string;
}
export declare class AttachmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(query: ListAttachmentsQueryDto): Promise<{
        data: AttachmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    listForFamily(familyId: string, query: ListAttachmentsQueryDto): Promise<{
        data: AttachmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    getById(attachmentId: string): Promise<AttachmentDetailDto>;
    getContent(attachmentId: string): Promise<{
        fileName: string;
        contentType?: string | null;
        size?: number | null;
        buffer: Buffer;
    }>;
    createForFamily(familyId: string, input: CreateAttachmentDto): Promise<AttachmentDetailDto>;
    create(input: CreateAttachmentDto): Promise<AttachmentDetailDto>;
    update(attachmentId: string, input: UpdateAttachmentDto): Promise<AttachmentDetailDto>;
    remove(attachmentId: string): Promise<void>;
    private mapAttachment;
    private mapAttachmentDetail;
    private buildWhere;
    private decodeBase64;
    private jsonFromDb;
    private jsonInput;
    private currentJson;
    private assertFamilyExists;
}
