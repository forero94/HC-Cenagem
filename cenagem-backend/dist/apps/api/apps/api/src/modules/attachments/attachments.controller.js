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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const _common_1 = require("../../../../../libs/common/src/index");
const attachments_service_1 = require("./attachments.service");
const list_attachments_query_1 = require("./dto/list-attachments.query");
const create_attachment_dto_1 = require("./dto/create-attachment.dto");
const update_attachment_dto_1 = require("./dto/update-attachment.dto");
let AttachmentsController = class AttachmentsController {
    attachments;
    constructor(attachments) {
        this.attachments = attachments;
    }
    list(query) {
        return this.attachments.list(query);
    }
    create(body, actor) {
        return this.attachments.create(body, actor);
    }
    getById(attachmentId) {
        return this.attachments.getById(attachmentId);
    }
    async download(attachmentId, res) {
        const content = await this.attachments.getContent(attachmentId);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(content.fileName)}"`);
        if (content.contentType) {
            res.setHeader('Content-Type', content.contentType);
        }
        else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        res.setHeader('Content-Length', String(content.size ?? content.buffer.length));
        res.send(content.buffer);
    }
    update(attachmentId, body) {
        return this.attachments.update(attachmentId, body);
    }
    async delete(attachmentId) {
        await this.attachments.remove(attachmentId);
        return { success: true };
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar adjuntos' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Adjuntos listados' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_attachments_query_1.ListAttachmentsQueryDto]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un adjunto' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Adjunto creado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_attachment_dto_1.CreateAttachmentDto, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':attachmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un adjunto' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Adjunto encontrado' }),
    __param(0, (0, common_1.Param)('attachmentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':attachmentId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar un adjunto en binario' }),
    __param(0, (0, common_1.Param)('attachmentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "download", null);
__decorate([
    (0, common_1.Patch)(':attachmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un adjunto' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Adjunto actualizado' }),
    __param(0, (0, common_1.Param)('attachmentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_attachment_dto_1.UpdateAttachmentDto]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':attachmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un adjunto' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Adjunto eliminado' }),
    __param(0, (0, common_1.Param)('attachmentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "delete", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, swagger_1.ApiTags)('attachments'),
    (0, common_1.Controller)({
        path: 'attachments',
        version: '1',
    }),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map