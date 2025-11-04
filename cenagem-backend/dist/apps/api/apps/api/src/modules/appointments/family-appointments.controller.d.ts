import { AppointmentsService } from './appointments.service';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
export declare class FamilyAppointmentsController {
    private readonly appointments;
    constructor(appointments: AppointmentsService);
    listByFamily(familyId: string, query: ListAppointmentsQueryDto): Promise<{
        data: import("./appointments.service").AppointmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createForFamily(familyId: string, body: CreateAppointmentDto): Promise<import("./appointments.service").AppointmentDto>;
}
