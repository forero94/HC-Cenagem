"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const database_1 = require("../../../../../libs/infrastructure/src/database");
const argon2 = __importStar(require("argon2"));
let UsersService = class UsersService {
    prisma;
    userInclude = {
        roles: {
            include: {
                role: true,
            },
        },
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: this.userInclude,
        });
    }
    findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { email: username.toLowerCase().trim() },
            include: this.userInclude,
        });
    }
    findByIdWithRoles(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: this.userInclude,
        });
    }
    async listUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: this.userInclude,
        });
    }
    async createUser(input, actorId) {
        const username = input.username.toLowerCase().trim();
        const documentNumber = input.documentNumber?.trim() ?? '';
        if (!documentNumber) {
            throw new common_1.BadRequestException('El DNI es obligatorio.');
        }
        const existing = await this.prisma.user.findUnique({
            where: { email: username },
        });
        if (existing) {
            throw new common_1.BadRequestException(`El usuario ${input.username} ya está registrado.`);
        }
        const passwordHash = await argon2.hash(input.password);
        const roleNames = input.roles ?? [];
        const trimmedLicense = input.licenseNumber?.trim() ?? '';
        const normalizedLicense = trimmedLicense.length > 0 ? trimmedLicense : null;
        return this.prisma.$transaction(async (tx) => {
            let roles = [];
            if (roleNames.length > 0) {
                roles = await tx.role.findMany({
                    where: { name: { in: roleNames } },
                    select: {
                        id: true,
                        name: true,
                        requiresLicense: true,
                    },
                });
                if (roles.length !== roleNames.length) {
                    const foundNames = new Set(roles.map((role) => role.name));
                    const missing = roleNames.filter((role) => !foundNames.has(role));
                    throw new common_1.BadRequestException(`Roles no válidos: ${missing.join(', ')}`);
                }
                if (roles.some((role) => role.requiresLicense) && !normalizedLicense) {
                    throw new common_1.BadRequestException('Los roles seleccionados requieren una matrícula profesional registrada.');
                }
            }
            const user = await tx.user.create({
                data: {
                    email: username,
                    passwordHash,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    documentNumber,
                    licenseNumber: normalizedLicense,
                },
            });
            if (roles.length > 0) {
                await tx.userRole.createMany({
                    data: roles.map((role) => ({
                        userId: user.id,
                        roleId: role.id,
                        assignedBy: actorId ?? null,
                    })),
                });
            }
            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                include: this.userInclude,
            });
        });
    }
    async updateStatus(userId, status) {
        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data: { status },
                include: this.userInclude,
            });
        }
        catch (error) {
            if (error instanceof library_1.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            throw error;
        }
    }
    async setUserRoles(userId, roleNames, actorId) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            const roles = await tx.role.findMany({
                where: { name: { in: roleNames } },
                select: {
                    id: true,
                    name: true,
                    requiresLicense: true,
                },
            });
            if (roles.length !== roleNames.length) {
                const foundNames = new Set(roles.map((role) => role.name));
                const missing = roleNames.filter((role) => !foundNames.has(role));
                throw new common_1.BadRequestException(`Roles no válidos: ${missing.join(', ')}`);
            }
            const needsLicense = roles.filter((role) => role.requiresLicense);
            const hasLicense = typeof user.licenseNumber === 'string' &&
                user.licenseNumber.trim().length > 0;
            if (needsLicense.length > 0 && !hasLicense) {
                throw new common_1.BadRequestException(`Los roles ${needsLicense
                    .map((role) => role.name)
                    .join(', ')} requieren una matrícula profesional registrada.`);
            }
            await tx.userRole.deleteMany({ where: { userId } });
            if (roles.length) {
                await tx.userRole.createMany({
                    data: roles.map((role) => ({
                        userId,
                        roleId: role.id,
                        assignedBy: actorId ?? null,
                    })),
                });
            }
            return tx.user.findUniqueOrThrow({
                where: { id: userId },
                include: this.userInclude,
            });
        });
    }
    async updateUser(userId, input) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            include: this.userInclude,
        });
        if (!existing) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const hasLicenseBoundRole = existing.roles.some((relation) => relation.role.requiresLicense);
        const data = {};
        let hasChanges = false;
        if (typeof input.username === 'string') {
            const normalized = input.username.trim().toLowerCase();
            if (!normalized) {
                throw new common_1.BadRequestException('El usuario no puede quedar vacío.');
            }
            data.email = normalized;
            hasChanges = true;
        }
        if (typeof input.firstName === 'string') {
            const trimmed = input.firstName.trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('El nombre es obligatorio.');
            }
            data.firstName = trimmed;
            hasChanges = true;
        }
        if (typeof input.lastName === 'string') {
            const trimmed = input.lastName.trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('El apellido es obligatorio.');
            }
            data.lastName = trimmed;
            hasChanges = true;
        }
        if (typeof input.documentNumber === 'string') {
            const trimmed = input.documentNumber.trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('El DNI es obligatorio.');
            }
            data.documentNumber = trimmed;
            hasChanges = true;
        }
        if (typeof input.licenseNumber === 'string') {
            const trimmed = input.licenseNumber.trim();
            if (hasLicenseBoundRole && trimmed.length === 0) {
                throw new common_1.BadRequestException('Los roles asignados requieren una matrícula profesional registrada.');
            }
            data.licenseNumber = trimmed.length > 0 ? trimmed : null;
            hasChanges = true;
        }
        if (typeof input.password === 'string') {
            const passwordHash = await argon2.hash(input.password);
            data.passwordHash = passwordHash;
            hasChanges = true;
        }
        if (!hasChanges) {
            throw new common_1.BadRequestException('No hay cambios para aplicar.');
        }
        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data,
                include: this.userInclude,
            });
        }
        catch (error) {
            if (error instanceof library_1.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException('Usuario no encontrado');
                }
                if (error.code === 'P2002') {
                    throw new common_1.BadRequestException('El usuario ya está en uso.');
                }
            }
            throw error;
        }
    }
    async deleteUser(userId) {
        try {
            await this.prisma.user.delete({
                where: { id: userId },
            });
        }
        catch (error) {
            if (error instanceof library_1.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            throw error;
        }
    }
    async updateLastLogin(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map