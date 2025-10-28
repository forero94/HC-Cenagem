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
exports.StudiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
let StudiesService = class StudiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listStudies(query) {
        const where = this.buildWhere(query);
        const take = query.limit ?? 50;
        const studies = await this.prisma.study.findMany({
            where,
            take: take + 1,
            skip: query.cursor ? 1 : 0,
            cursor: query.cursor ? { id: query.cursor } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        let nextCursor;
        if (studies.length > take) {
            const next = studies.pop();
            nextCursor = next?.id;
        }
        return {
            data: studies.map((study) => this.mapStudy(study)),
            meta: { nextCursor },
        };
    }
    async listForFamily(familyId, query) {
        return this.listStudies({ ...query, familyId });
    }
    async getById(studyId) {
        const study = await this.prisma.study.findUnique({
            where: { id: studyId },
        });
        if (!study) {
            throw new common_1.NotFoundException('Estudio no encontrado');
        }
        return this.mapStudy(study);
    }
    async createForFamily(familyId, input) {
        await this.assertFamilyExists(familyId);
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
        const created = await this.prisma.study.create({
            data: {
                familyId,
                memberId,
                type: input.type,
                status: input.status ?? client_1.StudyStatus.REQUESTED,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                requestedAt: input.requestedAt ? new Date(input.requestedAt) : null,
                resultAt: input.resultAt ? new Date(input.resultAt) : null,
                notes: input.notes?.trim() || null,
                metadata: this.jsonInput(input.metadata),
            },
        });
        return this.mapStudy(created);
    }
    async create(input) {
        if (!input.familyId) {
            throw new common_1.NotFoundException('Debe especificarse la familia para registrar el estudio');
        }
        return this.createForFamily(input.familyId, input);
    }
    async update(studyId, input) {
        const study = await this.prisma.study.findUnique({
            where: { id: studyId },
        });
        if (!study) {
            throw new common_1.NotFoundException('Estudio no encontrado');
        }
        if (input.memberId) {
            const member = await this.prisma.familyMember.findUnique({
                where: { id: input.memberId },
                select: { id: true, familyId: true },
            });
            if (!member || member.familyId !== study.familyId) {
                throw new common_1.NotFoundException('El miembro indicado no pertenece a la familia');
            }
        }
        const updated = await this.prisma.study.update({
            where: { id: studyId },
            data: {
                memberId: input.memberId !== undefined
                    ? (input.memberId ?? null)
                    : study.memberId,
                type: input.type ?? study.type,
                status: input.status ?? study.status,
                name: input.name !== undefined ? input.name.trim() : study.name,
                description: input.description !== undefined
                    ? input.description?.trim() || null
                    : study.description,
                requestedAt: input.requestedAt !== undefined
                    ? input.requestedAt
                        ? new Date(input.requestedAt)
                        : null
                    : study.requestedAt,
                resultAt: input.resultAt !== undefined
                    ? input.resultAt
                        ? new Date(input.resultAt)
                        : null
                    : study.resultAt,
                notes: input.notes !== undefined ? input.notes?.trim() || null : study.notes,
                metadata: input.metadata !== undefined
                    ? this.jsonInput(input.metadata)
                    : this.currentJson(study.metadata),
            },
        });
        return this.mapStudy(updated);
    }
    async remove(studyId) {
        const exists = await this.prisma.study.findUnique({
            where: { id: studyId },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Estudio no encontrado');
        }
        await this.prisma.study.delete({
            where: { id: studyId },
        });
    }
    mapStudy(study) {
        return {
            id: study.id,
            familyId: study.familyId,
            memberId: study.memberId,
            type: study.type,
            status: study.status,
            name: study.name,
            description: study.description,
            requestedAt: study.requestedAt ?? undefined,
            resultAt: study.resultAt ?? undefined,
            notes: study.notes,
            metadata: this.jsonFromDb(study.metadata),
            createdAt: study.createdAt,
            updatedAt: study.updatedAt,
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
        if (query.type) {
            where.type = query.type;
        }
        if (query.status) {
            where.status = query.status;
        }
        return where;
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
exports.StudiesService = StudiesService;
exports.StudiesService = StudiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], StudiesService);
//# sourceMappingURL=studies.service.js.map