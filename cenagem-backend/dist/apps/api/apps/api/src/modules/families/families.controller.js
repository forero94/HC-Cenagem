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
exports.FamiliesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const families_service_1 = require("./services/families.service");
const create_family_dto_1 = require("./dto/create-family.dto");
const update_family_dto_1 = require("./dto/update-family.dto");
const list_families_query_1 = require("./dto/list-families.query");
const create_member_dto_1 = require("./dto/create-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const create_evolution_dto_1 = require("./dto/create-evolution.dto");
const list_evolutions_query_1 = require("./dto/list-evolutions.query");
const family_members_service_1 = require("./services/family-members.service");
const family_evolutions_service_1 = require("./services/family-evolutions.service");
let FamiliesController = class FamiliesController {
    families;
    members;
    evolutions;
    constructor(families, members, evolutions) {
        this.families = families;
        this.members = members;
        this.evolutions = evolutions;
    }
    listFamilies(query) {
        return this.families.listFamilies(query);
    }
    createFamily(body) {
        return this.families.createFamily(body);
    }
    getFamily(familyId) {
        return this.families.getFamilyOrThrow(familyId);
    }
    updateFamily(familyId, body) {
        return this.families.updateFamily(familyId, body);
    }
    listMembers(familyId) {
        return this.members.listMembers(familyId);
    }
    createMember(familyId, body) {
        return this.members.createMember(familyId, body);
    }
    getMember(familyId, memberId) {
        return this.members.getMemberOrThrow(familyId, memberId);
    }
    updateMember(familyId, memberId, body) {
        return this.members.updateMember(familyId, memberId, body);
    }
    async deleteMember(familyId, memberId) {
        await this.members.deleteMember(familyId, memberId);
        return { success: true };
    }
    listEvolutions(familyId, query) {
        return this.evolutions.listEvolutions(familyId, query);
    }
    createEvolution(familyId, memberId, body) {
        return this.evolutions.createEvolution(familyId, memberId, body);
    }
};
exports.FamiliesController = FamiliesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar familias' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Listado paginado de familias' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_families_query_1.ListFamiliesQueryDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "listFamilies", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una nueva familia' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Familia creada' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_family_dto_1.CreateFamilyDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "createFamily", null);
__decorate([
    (0, common_1.Get)(':familyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Familia encontrada' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "getFamily", null);
__decorate([
    (0, common_1.Patch)(':familyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Familia actualizada' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_family_dto_1.UpdateFamilyDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "updateFamily", null);
__decorate([
    (0, common_1.Get)(':familyId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar miembros de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Miembros listados' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Post)(':familyId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un miembro dentro de una familia' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Miembro creado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_member_dto_1.CreateMemberDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)(':familyId/members/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un miembro específico de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Miembro encontrado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "getMember", null);
__decorate([
    (0, common_1.Patch)(':familyId/members/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un miembro dentro de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Miembro actualizado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_member_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)(':familyId/members/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un miembro de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Miembro eliminado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "deleteMember", null);
__decorate([
    (0, common_1.Get)(':familyId/evolutions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar evoluciones clínicas asociadas a la familia',
    }),
    (0, swagger_1.ApiOkResponse)({ description: 'Evoluciones listadas' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_evolutions_query_1.ListEvolutionsQueryDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "listEvolutions", null);
__decorate([
    (0, common_1.Post)(':familyId/members/:memberId/evolutions'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar una evolución clínica para un miembro' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Evolución creada' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_evolution_dto_1.CreateEvolutionDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "createEvolution", null);
exports.FamiliesController = FamiliesController = __decorate([
    (0, swagger_1.ApiTags)('families'),
    (0, common_1.Controller)({
        path: 'families',
        version: '1',
    }),
    __metadata("design:paramtypes", [families_service_1.FamiliesService,
        family_members_service_1.FamilyMembersService,
        family_evolutions_service_1.FamilyEvolutionsService])
], FamiliesController);
//# sourceMappingURL=families.controller.js.map