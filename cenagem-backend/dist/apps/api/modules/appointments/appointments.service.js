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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
let AppointmentsService = class AppointmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listAppointments(query) {
        const where = this.buildWhere(query);
        const take = query.limit ?? 50;
        const appointments = await this.prisma.appointment.findMany({
            where,
            take: take + 1,
            skip: query.cursor ? 1 : 0,
            cursor: query.cursor ? { id: query.cursor } : undefined,
            orderBy: { scheduledFor: 'asc' },
        });
        let nextCursor;
        if (appointments.length > take) {
            const next = appointments.pop();
            nextCursor = next?.id;
        }
        return {
            data: appointments.map((appointment) => this.mapAppointment(appointment)),
            meta: { nextCursor },
        };
    }
    async listForFamily(familyId, query) {
        return this.listAppointments({ ...query, familyId });
    }
    async getById(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Turno no encontrado');
        }
        return this.mapAppointment(appointment);
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
        const created = await this.prisma.appointment.create({
            data: {
                familyId,
                memberId,
                scheduledFor: new Date(input.scheduledFor),
                durationMins: input.durationMins ?? null,
                seatNumber: input.seatNumber ?? null,
                motive: input.motive?.trim() || null,
                notes: input.notes?.trim() || null,
                status: input.status ?? client_1.AppointmentStatus.SCHEDULED,
                metadata: this.jsonInput(input.metadata),
            },
        });
        return this.mapAppointment(created);
    }
    async create(input) {
        if (!input.familyId) {
            if (input.memberId) {
                throw new common_1.BadRequestException('Turnos sin HC no pueden asociarse a un paciente existente');
            }
            const created = await this.prisma.appointment.create({
                data: {
                    familyId: null,
                    memberId: null,
                    scheduledFor: new Date(input.scheduledFor),
                    durationMins: input.durationMins ?? null,
                    seatNumber: input.seatNumber ?? null,
                    motive: input.motive?.trim() || null,
                    notes: input.notes?.trim() || null,
                    status: input.status ?? client_1.AppointmentStatus.SCHEDULED,
                    metadata: this.jsonInput(input.metadata),
                },
            });
            return this.mapAppointment(created);
        }
        return this.createForFamily(input.familyId, input);
    }
    async update(appointmentId, input) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Turno no encontrado');
        }
        if (input.memberId) {
            const member = await this.prisma.familyMember.findUnique({
                where: { id: input.memberId },
                select: { id: true, familyId: true },
            });
            if (!member || member.familyId !== appointment.familyId) {
                throw new common_1.NotFoundException('El miembro indicado no pertenece a la familia');
            }
        }
        const updated = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                memberId: input.memberId !== undefined
                    ? (input.memberId ?? null)
                    : appointment.memberId,
                scheduledFor: input.scheduledFor !== undefined
                    ? new Date(input.scheduledFor)
                    : appointment.scheduledFor,
                durationMins: input.durationMins !== undefined
                    ? (input.durationMins ?? null)
                    : appointment.durationMins,
                seatNumber: input.seatNumber !== undefined
                    ? (input.seatNumber ?? null)
                    : appointment.seatNumber,
                motive: input.motive !== undefined
                    ? input.motive?.trim() || null
                    : appointment.motive,
                notes: input.notes !== undefined
                    ? input.notes?.trim() || null
                    : appointment.notes,
                status: input.status ?? appointment.status,
                metadata: input.metadata !== undefined
                    ? this.jsonInput(input.metadata)
                    : this.currentJson(appointment.metadata),
            },
        });
        return this.mapAppointment(updated);
    }
    async remove(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { id: true },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Turno no encontrado');
        }
        await this.prisma.appointment.delete({
            where: { id: appointmentId },
        });
    }
    buildWhere(query) {
        const where = {};
        if (query.familyId) {
            where.familyId = query.familyId;
        }
        if (query.memberId) {
            where.memberId = query.memberId;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.date) {
            const start = new Date(query.date);
            const end = new Date(query.date);
            end.setDate(end.getDate() + 1);
            where.scheduledFor = { gte: start, lt: end };
        }
        else if (query.from || query.to) {
            const range = {};
            if (query.from) {
                range.gte = new Date(query.from);
            }
            if (query.to) {
                const end = new Date(query.to);
                end.setDate(end.getDate() + 1);
                range.lt = end;
            }
            where.scheduledFor = range;
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
    mapAppointment(appointment) {
        return {
            id: appointment.id,
            familyId: appointment.familyId ?? null,
            memberId: appointment.memberId,
            scheduledFor: appointment.scheduledFor,
            durationMins: appointment.durationMins,
            seatNumber: appointment.seatNumber,
            motive: appointment.motive,
            notes: appointment.notes,
            status: appointment.status,
            metadata: this.jsonFromDb(appointment.metadata),
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
        };
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
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map