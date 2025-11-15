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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const _common_1 = require("../../../../../dist/libs/common/index");
const audit_service_1 = require("../audit/audit.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_user_roles_dto_1 = require("./dto/update-user-roles.dto");
const update_user_status_dto_1 = require("./dto/update-user-status.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    auditService;
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async getProfile(user) {
        const fullUser = await this.usersService.findByIdWithRoles(user.userId);
        if (!fullUser) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.toResponse(fullUser);
    }
    async listUsers() {
        const users = await this.usersService.listUsers();
        return users.map((user) => this.toResponse(user));
    }
    async createUser(input, actor) {
        const user = await this.usersService.createUser(input, actor.userId);
        await this.auditService.log(actor.userId, 'user.create', 'user', user.id, {
            roles: user.roles.map((relation) => relation.role.name),
        });
        return this.toResponse(user);
    }
    async updateUser(userId, payload, actor) {
        const updated = await this.usersService.updateUser(userId, payload);
        const changedFields = Object.entries(payload)
            .filter(([, value]) => typeof value !== 'undefined')
            .map(([key]) => key);
        await this.auditService.log(actor.userId, 'user.update', 'user', updated.id, {
            fields: changedFields.filter((field) => field !== 'password'),
            passwordReset: payload.password ? true : undefined,
        });
        return this.toResponse(updated);
    }
    async updateStatus(userId, payload, actor) {
        const user = await this.usersService.updateStatus(userId, payload.status);
        await this.auditService.log(actor.userId, 'user.updateStatus', 'user', user.id, {
            status: payload.status,
        });
        return this.toResponse(user);
    }
    async updateRoles(userId, payload, actor) {
        const user = await this.usersService.setUserRoles(userId, payload.roles, actor.userId);
        await this.auditService.log(actor.userId, 'user.updateRoles', 'user', user.id, {
            roles: payload.roles,
        });
        return this.toResponse(user);
    }
    async deleteUser(userId, actor) {
        if (userId === actor.userId) {
            throw new common_1.BadRequestException('No podés eliminar tu propia cuenta activa.');
        }
        await this.usersService.deleteUser(userId);
        await this.auditService.log(actor.userId, 'user.delete', 'user', userId);
        return { success: true };
    }
    toResponse(user) {
        const roleRelations = user.roles;
        const roleNames = roleRelations.map((relation) => relation.role.name);
        const permissions = Array.from(new Set(roleRelations.flatMap((relation) => relation.role.permissions)));
        const computedDisplayName = [user.firstName, user.lastName]
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
            .join(' ')
            .trim();
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            documentNumber: user.documentNumber ?? null,
            displayName: computedDisplayName || user.email,
            primaryRole: roleNames[0] ?? null,
            status: user.status,
            roles: roleNames,
            permissions,
            licenseNumber: user.licenseNumber ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(),
    (0, _common_1.Permissions)(client_1.Permission.USERS_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)(),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_status_dto_1.UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/roles'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_roles_dto_1.UpdateUserRolesDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRoles", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, _common_1.Permissions)(client_1.Permission.USERS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, _common_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)({
        path: 'users',
        version: '1',
    }),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_service_1.AuditService])
], UsersController);
//# sourceMappingURL=users.controller.js.map