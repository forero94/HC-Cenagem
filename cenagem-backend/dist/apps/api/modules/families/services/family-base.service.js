"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyBaseService = void 0;
const common_1 = require("@nestjs/common");
const family_mapper_service_1 = require("./family-mapper.service");
class FamilyBaseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureFamilyExists(client, familyId) {
        const exists = await client.family.findUnique({
            where: { id: familyId },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
    }
    async findMemberOrThrow(client, familyId, memberId) {
        const member = await client.familyMember.findUnique({
            where: { id: memberId },
            select: family_mapper_service_1.familyMemberSelect.select,
        });
        if (!member || member.familyId !== familyId) {
            throw new common_1.NotFoundException('Miembro no encontrado en la familia');
        }
        return member;
    }
}
exports.FamilyBaseService = FamilyBaseService;
//# sourceMappingURL=family-base.service.js.map