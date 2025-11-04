import { AppointmentStatus } from '@prisma/client';
export declare class ListAppointmentsQueryDto {
    familyId?: string;
    memberId?: string;
    date?: string;
    from?: string;
    to?: string;
    status?: AppointmentStatus;
    limit: number;
    cursor?: string;
}
