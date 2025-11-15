import type { Response } from 'express';
import { ActiveUserData } from '@common';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
export declare class AttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    list(query: ListAttachmentsQueryDto): Promise<{
        data: import("./attachments.service").AttachmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    create(body: CreateAttachmentDto, actor: ActiveUserData): Promise<import("./attachments.service").AttachmentDetailDto>;
    getById(attachmentId: string): Promise<import("./attachments.service").AttachmentDetailDto>;
    download(attachmentId: string, res: Response): Promise<Buffer>;
    update(attachmentId: string, body: UpdateAttachmentDto): Promise<import("./attachments.service").AttachmentDetailDto>;
    delete(attachmentId: string): Promise<{
        success: boolean;
    }>;
}
