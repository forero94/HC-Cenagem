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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
let AttachmentsService = class AttachmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        const where = this.buildWhere(query);
        const take = query.limit ?? 50;
        const attachments = await this.prisma.attachment.findMany({
            where,
            take: take + 1,
            skip: query.cursor ? 1 : 0,
            cursor: query.cursor ? { id: query.cursor } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        let nextCursor;
        if (attachments.length > take) {
            const next = attachments.pop();
            nextCursor = next?.id;
        }
        return {
            data: attachments.map((attachment) => this.mapAttachment(attachment)),
            meta: { nextCursor },
        };
    }
    async listForFamily(familyId, query) {
        return this.list({ ...query, familyId });
    }
    async getById(attachmentId) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Adjunto no encontrado');
        }
        return this.mapAttachmentDetail(attachment);
    }
    async getContent(attachmentId) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
            select: {
                fileName: true,
                contentType: true,
                size: true,
                content: true,
            },
        });
        if (!attachment || !attachment.content) {
            throw new common_1.NotFoundException('Contenido no disponible');
        }
        return {
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            size: attachment.size,
            buffer: Buffer.from(attachment.content),
        };
    }
    async createForFamily(familyId, input) {
        await this.assertFamilyExists(familyId);
        const buffer = this.decodeBase64(input.base64Data);
        let memberId = null;
        if (input.memberId) {
            const member = await this.prisma.familyMember.findUnique({
                where: { id: input.memberId },
                select: { id: true, familyId: true },
            });
            if (!member || member.familyId !== familyId) {
                throw new common_1.NotFoundException('El miembro indicado no pertenece a la familia');
            }
            memberId = member.id;
        }
        let studyId = null;
        if (input.studyId) {
            const study = await this.prisma.study.findUnique({
                where: { id: input.studyId },
                select: { id: true, familyId: true },
            });
            if (!study || study.familyId !== familyId) {
                throw new common_1.NotFoundException('El estudio indicado no pertenece a la familia');
            }
            studyId = study.id;
        }
        const created = await this.prisma.attachment.create({
            data: {
                familyId,
                memberId,
                studyId,
                fileName: input.fileName.trim(),
                contentType: input.contentType?.trim() || null,
                size: buffer.length,
                category: input.category ?? client_1.AttachmentCategory.OTHER,
                description: input.description?.trim() || null,
                tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
                metadata: this.jsonInput(input.metadata),
                content: buffer,
            },
        });
        return this.mapAttachmentDetail(created);
    }
    async create(input) {
        if (!input.familyId) {
            throw new common_1.NotFoundException('Debe especificarse la familia para subir un adjunto');
        }
        return this.createForFamily(input.familyId, input);
    }
    async update(attachmentId, input) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Adjunto no encontrado');
        }
        if (input.memberId) {
            const member = await this.prisma.familyMember.findUnique({
                where: { id: input.memberId },
                select: { id: true, familyId: true },
            });
            if (!member || member.familyId !== attachment.familyId) {
                throw new common_1.NotFoundException('El miembro indicado no pertenece a la familia');
            }
        }
        if (input.studyId) {
            const study = await this.prisma.study.findUnique({
                where: { id: input.studyId },
                select: { id: true, familyId: true },
            });
            if (!study || study.familyId !== attachment.familyId) {
                throw new common_1.NotFoundException('El estudio indicado no pertenece a la familia');
            }
        }
        let contentBuffer;
        if (input.base64Data) {
            contentBuffer = this.decodeBase64(input.base64Data);
        }
        const updated = await this.prisma.attachment.update({
            where: { id: attachmentId },
            data: {
                memberId: input.memberId !== undefined
                    ? (input.memberId ?? null)
                    : attachment.memberId,
                studyId: input.studyId !== undefined
                    ? (input.studyId ?? null)
                    : attachment.studyId,
                fileName: input.fileName !== undefined
                    ? input.fileName.trim()
                    : attachment.fileName,
                contentType: input.contentType !== undefined
                    ? input.contentType?.trim() || null
                    : attachment.contentType,
                category: input.category ?? attachment.category,
                description: input.description !== undefined
                    ? input.description?.trim() || null
                    : attachment.description,
                tags: input.tags !== undefined
                    ? input.tags.map((tag) => tag.trim()).filter(Boolean)
                    : attachment.tags,
                metadata: input.metadata !== undefined
                    ? this.jsonInput(input.metadata)
                    : this.currentJson(attachment.metadata),
                content: contentBuffer ?? undefined,
                size: contentBuffer !== undefined ? contentBuffer.length : attachment.size,
            },
        });
        return this.mapAttachmentDetail(updated);
    }
    async remove(attachmentId) {
        const exists = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Adjunto no encontrado');
        }
        await this.prisma.attachment.delete({
            where: { id: attachmentId },
        });
    }
    mapAttachment(attachment) {
        return {
            id: attachment.id,
            familyId: attachment.familyId,
            memberId: attachment.memberId,
            studyId: attachment.studyId,
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            size: attachment.size,
            category: attachment.category,
            description: attachment.description,
            tags: attachment.tags ?? [],
            metadata: this.jsonFromDb(attachment.metadata),
            createdAt: attachment.createdAt,
            updatedAt: attachment.updatedAt,
        };
    }
    mapAttachmentDetail(attachment) {
        const base = this.mapAttachment(attachment);
        return {
            ...base,
            base64Data: attachment.content
                ? Buffer.from(attachment.content).toString('base64')
                : undefined,
        };
    }
    buildWhere(query) {
        const where = {};
        if (query.familyId) {
            where.familyId = query.familyId;
        }
        if (query.memberId) {
            where.memberId = query.memberId;
        }
        if (query.studyId) {
            where.studyId = query.studyId;
        }
        if (query.category) {
            where.category = query.category;
        }
        if (query.tags && query.tags.length > 0) {
            where.tags = {
                hasEvery: query.tags.map((tag) => tag.trim()).filter(Boolean),
            };
        }
        return where;
    }
    decodeBase64(base64) {
        try {
            return Buffer.from(base64, 'base64');
        }
        catch (error) {
            throw new common_1.BadRequestException('Contenido base64 inválido');
        }
    }
    jsonFromDb(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        return value;
    }
    jsonInput(value) {
        if (value === undefined || value === null) {
            return client_1.Prisma.JsonNull;
        }
        return value;
    }
    currentJson(value) {
        if (value === null || value === undefined) {
            return client_1.Prisma.JsonNull;
        }
        return value;
    }
    async assertFamilyExists(familyId) {
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            select: { id: true },
        });
        if (!family) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map