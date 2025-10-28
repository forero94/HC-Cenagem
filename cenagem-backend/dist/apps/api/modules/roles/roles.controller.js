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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const _common_1 = require("../../../../../dist/libs/common/index");
const audit_service_1 = require("../audit/audit.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const roles_service_1 = require("./roles.service");
let RolesController = class RolesController {
    rolesService;
    auditService;
    constructor(rolesService, auditService) {
        this.rolesService = rolesService;
        this.auditService = auditService;
    }
    findAll() {
        return this.rolesService.findAll();
    }
    async createRole(payload, actor) {
        const role = await this.rolesService.create(payload);
        await this.auditService.log(actor.userId, 'role.create', 'role', role.id, {
            permissions: role.permissions,
        });
        return role;
    }
    async updateRole(roleId, payload, actor) {
        const role = await this.rolesService.update(roleId, payload);
        await this.auditService.log(actor.userId, 'role.update', 'role', role.id, {
            permissions: payload.permissions,
        });
        return role;
    }
    async removeRole(roleId, actor) {
        const role = await this.rolesService.remove(roleId);
        await this.auditService.log(actor.userId, 'role.delete', 'role', role.id);
        return;
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, _common_1.Permissions)(client_1.Permission.USERS_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.HttpCode)(204),
    (0, common_1.Delete)(':id'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "removeRole", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('roles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)({
        path: 'roles',
        version: '1',
    }),
    __metadata("design:paramtypes", [roles_service_1.RolesService,
        audit_service_1.AuditService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map