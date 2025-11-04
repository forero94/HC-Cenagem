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
exports.UploadTicketsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("../../../../../libs/infrastructure/src/database");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const SECRET_BYTES = 24;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
let UploadTicketsService = class UploadTicketsService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async createForFamily(input) {
        const family = await this.prisma.family.findUnique({
            where: { id: input.familyId },
            select: { id: true, code: true, displayName: true },
        });
        if (!family) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
        let member = null;
        if (input.memberId) {
            member = await this.prisma.familyMember.findUnique({
                where: { id: input.memberId },
                select: {
                    id: true,
                    familyId: true,
                    filiatorios: true,
                    role: true,
                    givenName: true,
                    lastName: true,
                },
            });
            if (!member || member.familyId !== family.id) {
                throw new common_1.NotFoundException('El integrante indicado no pertenece a la familia.');
            }
        }
        const ttlMinutes = this.resolveTtlMinutes(input.expiresInMinutes);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        const secret = (0, crypto_1.randomBytes)(SECRET_BYTES).toString('hex');
        const secretHash = await argon2.hash(secret);
        const created = await this.prisma.uploadTicket.create({
            data: {
                familyId: family.id,
                memberId: member?.id ?? null,
                createdById: input.createdById,
                secretHash,
                expiresAt,
                metadata: member ? this.buildTicketMetadata(member) : client_1.Prisma.JsonNull,
            },
            include: {
                family: { select: { id: true, code: true, displayName: true } },
                member: {
                    select: {
                        id: true,
                        familyId: true,
                        filiatorios: true,
                        role: true,
                        givenName: true,
                        lastName: true,
                    },
                },
            },
        });
        return {
            ticket: `${created.id}.${secret}`,
            expiresAt: created.expiresAt,
            familyId: created.familyId,
            memberId: created.memberId,
            familyCode: created.family.code,
            familyDisplayName: created.family.displayName,
            memberLabel: this.buildMemberLabel(created.member),
        };
    }
    async consume(ticketValue) {
        const { id, secret } = this.parseTicketValue(ticketValue);
        const ticket = await this.prisma.uploadTicket.findUnique({
            where: { id },
            include: {
                family: { select: { id: true, code: true, displayName: true } },
                member: {
                    select: {
                        id: true,
                        filiatorios: true,
                        role: true,
                        givenName: true,
                        lastName: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!ticket || ticket.revokedAt) {
            throw new common_1.UnauthorizedException('El ticket no es válido.');
        }
        if (ticket.expiresAt.getTime() <= Date.now()) {
            throw new common_1.UnauthorizedException('El ticket expiró.');
        }
        const matches = await argon2.verify(ticket.secretHash, secret);
        if (!matches) {
            throw new common_1.UnauthorizedException('El ticket no es válido.');
        }
        const familyMembers = await this.prisma.familyMember.findMany({
            where: { familyId: ticket.familyId },
            select: {
                id: true,
                role: true,
                givenName: true,
                middleName: true,
                lastName: true,
                filiatorios: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        });
        const members = familyMembers.map((member) => {
            const metadataLabel = this.getMemberMetadataLabel(member.metadata);
            const fallbackFullName = [
                member.givenName,
                member.middleName,
                member.lastName,
            ]
                .filter((part) => typeof part === 'string' && part.trim())
                .join(' ');
            const label = metadataLabel ||
                this.buildMemberLabel(member) ||
                fallbackFullName ||
                member.id;
            return {
                id: member.id,
                label,
                role: member.role,
                initials: this.getMemberInitials(member.filiatorios),
            };
        });
        await this.prisma.uploadTicket.update({
            where: { id: ticket.id },
            data: {
                usageCount: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });
        return {
            ticket,
            familyCode: ticket.family.code,
            familyDisplayName: ticket.family.displayName,
            memberLabel: this.buildMemberLabel(ticket.member),
            members,
        };
    }
    parseTicketValue(ticket) {
        if (!ticket || typeof ticket !== 'string') {
            throw new common_1.BadRequestException('Ticket inválido.');
        }
        const [id, secret] = ticket.split('.');
        if (!id || !secret) {
            throw new common_1.BadRequestException('Ticket inválido.');
        }
        return { id, secret };
    }
    resolveTtlMinutes(requested) {
        const fallback = Number(this.config.get('attachments.uploadTicket.ttlMinutes') ?? 10);
        if (!requested || Number.isNaN(requested)) {
            return clamp(fallback, 1, 180);
        }
        return clamp(requested, 1, 180);
    }
    getMemberInitials(filiatorios) {
        if (!filiatorios || typeof filiatorios !== 'object') {
            return null;
        }
        const record = filiatorios;
        return typeof record.iniciales === 'string' ? record.iniciales : null;
    }
    buildTicketMetadata(member) {
        const metadata = {};
        if (member.role) {
            metadata.memberRole = member.role;
        }
        const initials = this.getMemberInitials(member.filiatorios);
        if (initials) {
            metadata.memberInitials = initials;
        }
        return metadata;
    }
    getMemberMetadataLabel(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            return null;
        }
        const record = metadata;
        const label = record.nombreCompleto ?? record.displayName ?? null;
        if (typeof label === 'string' && label.trim()) {
            return label.trim();
        }
        return null;
    }
    buildMemberLabel(member) {
        if (!member) {
            return null;
        }
        const initials = this.getMemberInitials(member.filiatorios);
        if (initials) {
            return initials;
        }
        if (member.role) {
            return member.role;
        }
        const fullName = [member.givenName, member.lastName]
            .filter((part) => typeof part === 'string' && part.trim())
            .join(' ');
        return fullName || null;
    }
};
exports.UploadTicketsService = UploadTicketsService;
exports.UploadTicketsService = UploadTicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        config_1.ConfigService])
], UploadTicketsService);
//# sourceMappingURL=upload-tickets.service.js.map