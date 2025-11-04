import { AppointmentStatus } from '@prisma/client';
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
export declare class AppointmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listAppointments(query: ListAppointmentsQueryDto): Promise<{
        data: AppointmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    listForFamily(familyId: string, query: ListAppointmentsQueryDto): Promise<{
        data: AppointmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    getById(appointmentId: string): Promise<AppointmentDto>;
    createForFamily(familyId: string, input: CreateAppointmentDto): Promise<AppointmentDto>;
    create(input: CreateAppointmentDto): Promise<AppointmentDto>;
    update(appointmentId: string, input: UpdateAppointmentDto): Promise<AppointmentDto>;
    remove(appointmentId: string): Promise<void>;
    private buildWhere;
    private jsonFromDb;
    private jsonInput;
    private currentJson;
    private mapAppointment;
    private assertFamilyExists;
}
