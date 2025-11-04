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
exports.FamilyAttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../../../../../libs/infrastructure/src/database");
const family_mapper_service_1 = require("./family-mapper.service");
const family_base_service_1 = require("./family-base.service");
let FamilyAttachmentsService = class FamilyAttachmentsService extends family_base_service_1.FamilyBaseService {
    mapper;
    constructor(prisma, mapper) {
        super(prisma);
        this.mapper = mapper;
    }
    async listAttachments(familyId) {
        return this.prisma.$transaction(async (tx) => {
            await this.ensureFamilyExists(tx, familyId);
            return this.getAttachmentsForFamily(familyId, tx);
        });
    }
    async getAttachmentsForFamily(familyId, client) {
        const attachments = await client.attachment.findMany({
            where: { familyId },
            orderBy: { createdAt: 'desc' },
        });
        return attachments.map((attachment) => this.mapper.mapAttachment(attachment));
    }
};
exports.FamilyAttachmentsService = FamilyAttachmentsService;
exports.FamilyAttachmentsService = FamilyAttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        family_mapper_service_1.FamilyMapper])
], FamilyAttachmentsService);
//# sourceMappingURL=family-attachments.service.js.map