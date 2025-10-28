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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    prisma;
    usersService;
    jwtService;
    configService;
    auditService;
    constructor(prisma, usersService, jwtService, configService, auditService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
    }
    async login(credentials, context) {
        const user = await this.usersService.findByEmailWithRoles(credentials.email);
        if (!user || user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const passwordValid = await argon2.verify(user.passwordHash, credentials.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const sessionId = (0, crypto_1.randomUUID)();
        const tokenPair = await this.generateTokenPair(user, sessionId);
        await this.persistSession(sessionId, user.id, tokenPair.refreshToken, context);
        await this.usersService.updateLastLogin(user.id);
        await this.auditService.log(user.id, 'auth.login', 'user', user.id, {
            ip: this.normalizeIp(context.ip),
            userAgent: context.userAgent,
        });
        return tokenPair;
    }
    async refresh(refreshToken, context) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Token de refresco inválido.');
        }
        const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session ||
            session.revokedAt ||
            session.expiresAt.getTime() <= Date.now()) {
            throw new common_1.UnauthorizedException('Sesión no válida o expirada.');
        }
        const refreshMatches = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (!refreshMatches) {
            await this.prisma.session.update({
                where: { id: session.id },
                data: { revokedAt: new Date(), revokedBy: session.userId },
            });
            throw new common_1.UnauthorizedException('Token de refresco inválido.');
        }
        const user = await this.usersService.findByIdWithRoles(session.userId);
        if (!user || user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Usuario inactivo.');
        }
        const tokenPair = await this.generateTokenPair(user, session.id);
        await this.replaceSessionRefreshToken(session.id, tokenPair.refreshToken, context);
        await this.auditService.log(user.id, 'auth.refresh', 'session', session.id, {
            ip: this.normalizeIp(context.ip),
            userAgent: context.userAgent,
        });
        return tokenPair;
    }
    async logout(userId, sessionId) {
        const result = await this.prisma.session.updateMany({
            where: {
                id: sessionId,
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                revokedBy: userId,
            },
        });
        if (result.count > 0) {
            await this.auditService.log(userId, 'auth.logout', 'session', sessionId);
        }
    }
    async logoutAll(userId) {
        const result = await this.prisma.session.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                revokedBy: userId,
            },
        });
        if (result.count > 0) {
            await this.auditService.log(userId, 'auth.logoutAll', 'session', null);
        }
    }
    async generateTokenPair(user, sessionId) {
        const roles = user.roles.map((relation) => relation.role.name);
        const permissions = this.collectPermissions(user);
        const accessPayload = {
            sub: user.id,
            email: user.email,
            roles,
            permissions,
            sessionId,
        };
        const accessToken = await this.jwtService.signAsync(accessPayload, {
            expiresIn: this.accessTokenTtl,
        });
        const refreshPayload = {
            sub: user.id,
            sessionId,
        };
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            secret: this.refreshSecret,
            expiresIn: this.refreshTokenTtl,
            jwtid: sessionId,
        });
        const accessDecoded = this.decodeToken(accessToken);
        const refreshDecoded = this.decodeToken(refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.secondsUntil(accessDecoded?.exp),
            refreshExpiresIn: this.secondsUntil(refreshDecoded?.exp),
        };
    }
    async persistSession(sessionId, userId, refreshToken, context) {
        await this.prisma.session.create({
            data: {
                id: sessionId,
                userId,
                refreshTokenHash: await argon2.hash(refreshToken),
                userAgent: context.userAgent?.slice(0, 200) ?? null,
                ipAddress: this.normalizeIp(context.ip),
                expiresAt: this.tokenExpirationDate(refreshToken),
            },
        });
    }
    async replaceSessionRefreshToken(sessionId, refreshToken, context) {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                refreshTokenHash: await argon2.hash(refreshToken),
                userAgent: context.userAgent?.slice(0, 200) ?? null,
                ipAddress: this.normalizeIp(context.ip),
                expiresAt: this.tokenExpirationDate(refreshToken),
                revokedAt: null,
                revokedBy: null,
            },
        });
    }
    tokenExpirationDate(token) {
        const decoded = this.decodeToken(token);
        if (!decoded?.exp) {
            throw new Error('El token no posee fecha de expiración.');
        }
        return new Date(decoded.exp * 1000);
    }
    collectPermissions(user) {
        const permissions = user.roles.flatMap((relation) => relation.role.permissions);
        return Array.from(new Set(permissions));
    }
    secondsUntil(exp) {
        if (!exp) {
            return 0;
        }
        const nowSeconds = Math.floor(Date.now() / 1000);
        return Math.max(0, exp - nowSeconds);
    }
    normalizeIp(ip) {
        if (!ip) {
            return null;
        }
        if (Array.isArray(ip)) {
            return ip[0] ?? null;
        }
        return ip;
    }
    get accessTokenTtl() {
        return (this.configService.get('auth.access.expiresIn') ??
            '15m');
    }
    get refreshTokenTtl() {
        return (this.configService.get('auth.refresh.expiresIn') ??
            '7d');
    }
    get refreshSecret() {
        return (this.configService.get('auth.refresh.secret') ??
            'change-me-refresh');
    }
    decodeToken(token) {
        const decoded = this.jwtService.decode(token);
        if (!decoded || typeof decoded !== 'object') {
            return null;
        }
        return decoded;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map