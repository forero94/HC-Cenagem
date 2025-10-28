import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
export declare class FamilyAttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    list(familyId: string, query: ListAttachmentsQueryDto): Promise<{
        data: import("./attachments.service").AttachmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    create(familyId: string, body: CreateAttachmentDto): Promise<import("./attachments.service").AttachmentDetailDto>;
}
