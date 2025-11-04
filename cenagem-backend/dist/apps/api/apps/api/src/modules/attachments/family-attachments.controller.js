"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyAttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const _common_1 = require("../../../../../libs/common/src/index");
const attachments_service_1 = require("./attachments.service");
const list_attachments_query_1 = require("./dto/list-attachments.query");
const create_attachment_dto_1 = require("./dto/create-attachment.dto");
const upload_tickets_service_1 = require("./upload-tickets.service");
const create_upload_ticket_dto_1 = require("./dto/create-upload-ticket.dto");
let FamilyAttachmentsController = class FamilyAttachmentsController {
    attachments;
    uploadTickets;
    constructor(attachments, uploadTickets) {
        this.attachments = attachments;
        this.uploadTickets = uploadTickets;
    }
    list(familyId, query) {
        return this.attachments.listForFamily(familyId, query);
    }
    create(familyId, body, actor) {
        return this.attachments.createForFamily(familyId, body, actor);
    }
    createUploadTicket(familyId, body, actor) {
        return this.uploadTickets.createForFamily({
            familyId,
            memberId: body.memberId,
            createdById: actor.userId,
            expiresInMinutes: body.expiresInMinutes,
        });
    }
};
exports.FamilyAttachmentsController = FamilyAttachmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar adjuntos de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Adjuntos listados' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_attachments_query_1.ListAttachmentsQueryDto]),
    __metadata("design:returntype", void 0)
], FamilyAttachmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, _common_1.UploadTicketAllowed)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un adjunto para una familia' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Adjunto creado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_attachment_dto_1.CreateAttachmentDto, Object]),
    __metadata("design:returntype", void 0)
], FamilyAttachmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload-ticket'),
    (0, swagger_1.ApiOperation)({ summary: 'Generar un ticket temporal para subir fotos' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Ticket generado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_upload_ticket_dto_1.CreateUploadTicketDto, Object]),
    __metadata("design:returntype", void 0)
], FamilyAttachmentsController.prototype, "createUploadTicket", null);
exports.FamilyAttachmentsController = FamilyAttachmentsController = __decorate([
    (0, swagger_1.ApiTags)('attachments'),
    (0, common_1.Controller)({
        path: 'families/:familyId/attachments',
        version: '1',
    }),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService,
        upload_tickets_service_1.UploadTicketsService])
], FamilyAttachmentsController);
//# sourceMappingURL=family-attachments.controller.js.map