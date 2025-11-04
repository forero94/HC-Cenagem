import { AppointmentsService } from './appointments.service';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsController {
    private readonly appointments;
    constructor(appointments: AppointmentsService);
    listAppointments(query: ListAppointmentsQueryDto): Promise<{
        data: import("./appointments.service").AppointmentDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createAppointment(body: CreateAppointmentDto): Promise<import("./appointments.service").AppointmentDto>;
    getAppointment(appointmentId: string): Promise<import("./appointments.service").AppointmentDto>;
    updateAppointment(appointmentId: string, body: UpdateAppointmentDto): Promise<import("./appointments.service").AppointmentDto>;
    deleteAppointment(appointmentId: string): Promise<{
        success: boolean;
    }>;
}
