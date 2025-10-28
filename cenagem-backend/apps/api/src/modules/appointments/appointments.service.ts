import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export interface AppointmentDto {
  id: string;
  familyId?: string | null;
  memberId?: string | null;
  scheduledFor: Date;
  durationMins?: number | null;
  seatNumber?: number | null;
  motive?: string | null;
  notes?: string | null;
  status: AppointmentStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAppointments(
    query: ListAppointmentsQueryDto,
  ): Promise<{ data: AppointmentDto[]; meta: { nextCursor?: string } }> {
    const where = this.buildWhere(query);

    const take = query.limit ?? 50;

    const appointments = await this.prisma.appointment.findMany({
      where,
      take: take + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { scheduledFor: 'asc' },
    });

    let nextCursor: string | undefined;
    if (appointments.length > take) {
      const next = appointments.pop();
      nextCursor = next?.id;
    }

    return {
      data: appointments.map((appointment: Appointment) =>
        this.mapAppointment(appointment),
      ),
      meta: { nextCursor },
    };
  }

  async listForFamily(
    familyId: string,
    query: ListAppointmentsQueryDto,
  ): Promise<{ data: AppointmentDto[]; meta: { nextCursor?: string } }> {
    return this.listAppointments({ ...query, familyId });
  }

  async getById(appointmentId: string): Promise<AppointmentDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    return this.mapAppointment(appointment);
  }

  async createForFamily(
    familyId: string,
    input: CreateAppointmentDto,
  ): Promise<AppointmentDto> {
    await this.assertFamilyExists(familyId);

    let memberId: string | null = null;
    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });

      if (!member || member.familyId !== familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
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
        status: input.status ?? AppointmentStatus.SCHEDULED,
        metadata: this.jsonInput(input.metadata),
      },
    });

    return this.mapAppointment(created);
  }

  async create(input: CreateAppointmentDto): Promise<AppointmentDto> {
    if (!input.familyId) {
      if (input.memberId) {
        throw new BadRequestException(
          'Turnos sin HC no pueden asociarse a un paciente existente',
        );
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
          status: input.status ?? AppointmentStatus.SCHEDULED,
          metadata: this.jsonInput(input.metadata),
        },
      });

      return this.mapAppointment(created);
    }
    return this.createForFamily(input.familyId, input);
  }

  async update(
    appointmentId: string,
    input: UpdateAppointmentDto,
  ): Promise<AppointmentDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });

      if (!member || member.familyId !== appointment.familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        memberId:
          input.memberId !== undefined
            ? (input.memberId ?? null)
            : appointment.memberId,
        scheduledFor:
          input.scheduledFor !== undefined
            ? new Date(input.scheduledFor)
            : appointment.scheduledFor,
        durationMins:
          input.durationMins !== undefined
            ? (input.durationMins ?? null)
            : appointment.durationMins,
        seatNumber:
          input.seatNumber !== undefined
            ? (input.seatNumber ?? null)
            : appointment.seatNumber,
        motive:
          input.motive !== undefined
            ? input.motive?.trim() || null
            : appointment.motive,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : appointment.notes,
        status: input.status ?? appointment.status,
        metadata:
          input.metadata !== undefined
            ? this.jsonInput(input.metadata)
            : this.currentJson(appointment.metadata),
      },
    });

    return this.mapAppointment(updated);
  }

  async remove(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    await this.prisma.appointment.delete({
      where: { id: appointmentId },
    });
  }

  private buildWhere(
    query: ListAppointmentsQueryDto,
  ): Prisma.AppointmentWhereInput {
    const where: Prisma.AppointmentWhereInput = {};

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
    } else if (query.from || query.to) {
      const range: Prisma.DateTimeFilter = {};
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

  private jsonFromDb(
    value: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private jsonInput(
    value?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private currentJson(
    value: Prisma.JsonValue | null | undefined,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private mapAppointment(appointment: Appointment): AppointmentDto {
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

  private async assertFamilyExists(familyId: string): Promise<void> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true },
    });

    if (!family) {
      throw new NotFoundException('Familia no encontrada');
    }
  }
}
