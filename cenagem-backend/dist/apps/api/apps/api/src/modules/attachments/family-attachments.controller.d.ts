import { ActiveUserData } from '@common';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadTicketsService } from './upload-tickets.service';
import { CreateUploadTicketDto } from './dto/create-upload-ticket.dto';
export declare class FamilyAttachmentsController {
    private readonly attachments;
    private readonly uploadTickets;
    constructor(attachments: AttachmentsService, uploadTickets: UploadTicketsService);
    list(familyId: string, query: ListAttachmentsQueryDto): Promise<{
        data: import("./attachments.service").AttachmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    create(familyId: string, body: CreateAttachmentDto, actor: ActiveUserData): Promise<import("./attachments.service").AttachmentDetailDto>;
    createUploadTicket(familyId: string, body: CreateUploadTicketDto, actor: ActiveUserData): Promise<{
        ticket: string;
        expiresAt: Date;
        familyId: string;
        memberId: string | null;
        familyCode: string;
        familyDisplayName: string | null;
        memberLabel: string | null;
    }>;
}
