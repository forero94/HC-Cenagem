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
exports.FamilyEvolutionsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../../../../../dist/libs/infrastructure/database");
const family_mapper_service_1 = require("./family-mapper.service");
const family_base_service_1 = require("./family-base.service");
let FamilyEvolutionsService = class FamilyEvolutionsService extends family_base_service_1.FamilyBaseService {
    mapper;
    constructor(prisma, mapper) {
        super(prisma);
        this.mapper = mapper;
    }
    async listEvolutions(familyId, query) {
        return this.prisma.$transaction(async (tx) => {
            await this.ensureFamilyExists(tx, familyId);
            const take = query.limit ?? 50;
            const where = {
                familyId,
                ...(query.memberId ? { memberId: query.memberId } : {}),
            };
            const evolutions = await tx.memberEvolution.findMany({
                where,
                take: take + 1,
                skip: query.cursor ? 1 : 0,
                cursor: query.cursor ? { id: query.cursor } : undefined,
                orderBy: { recordedAt: 'desc' },
            });
            let nextCursor;
            if (evolutions.length > take) {
                const next = evolutions.pop();
                nextCursor = next?.id;
            }
            return {
                data: evolutions.map((item) => this.mapper.mapEvolution(item)),
                meta: { nextCursor },
            };
        });
    }
    async createEvolution(familyId, memberId, input) {
        return this.prisma.$transaction(async (tx) => {
            await this.findMemberOrThrow(tx, familyId, memberId);
            const recordedAt = input.recordedAt
                ? new Date(input.recordedAt)
                : new Date();
            const created = await tx.memberEvolution.create({
                data: {
                    familyId,
                    memberId,
                    authorName: input.authorName?.trim() || null,
                    authorEmail: input.authorEmail?.trim().toLowerCase() || null,
                    note: input.note.trim(),
                    recordedAt,
                },
            });
            return this.mapper.mapEvolution(created);
        });
    }
    async getEvolutionsForFamily(familyId, client) {
        const evolutions = await client.memberEvolution.findMany({
            where: { familyId },
            orderBy: { recordedAt: 'desc' },
        });
        return evolutions.map((item) => this.mapper.mapEvolution(item));
    }
};
exports.FamilyEvolutionsService = FamilyEvolutionsService;
exports.FamilyEvolutionsService = FamilyEvolutionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        family_mapper_service_1.FamilyMapper])
], FamilyEvolutionsService);
//# sourceMappingURL=family-evolutions.service.js.map