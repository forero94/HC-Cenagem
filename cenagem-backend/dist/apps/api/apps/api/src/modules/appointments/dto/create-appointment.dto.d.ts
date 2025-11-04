import { AppointmentStatus } from '@prisma/client';
export declare class CreateAppointmentDto {
    familyId?: string;
    memberId?: string;
    scheduledFor: string;
    durationMins?: number;
    seatNumber?: number;
    motive?: string;
    notes?: string;
    status?: AppointmentStatus;
    metadata?: Record<string, unknown>;
}
