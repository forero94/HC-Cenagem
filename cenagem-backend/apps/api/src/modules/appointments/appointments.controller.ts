import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller({
  path: 'appointments',
  version: '1',
})
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turnos' })
  @ApiOkResponse({ description: 'Turnos listados' })
  listAppointments(@Query() query: ListAppointmentsQueryDto) {
    return this.appointments.listAppointments(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo turno' })
  @ApiCreatedResponse({ description: 'Turno creado' })
  createAppointment(@Body() body: CreateAppointmentDto) {
    return this.appointments.create(body);
  }

  @Get(':appointmentId')
  @ApiOperation({ summary: 'Obtener un turno por ID' })
  @ApiOkResponse({ description: 'Turno encontrado' })
  getAppointment(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.appointments.getById(appointmentId);
  }

  @Patch(':appointmentId')
  @ApiOperation({ summary: 'Actualizar un turno' })
  @ApiOkResponse({ description: 'Turno actualizado' })
  updateAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.appointments.update(appointmentId, body);
  }

  @Delete(':appointmentId')
  @ApiOperation({ summary: 'Eliminar un turno' })
  @ApiOkResponse({ description: 'Turno eliminado' })
  async deleteAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    await this.appointments.remove(appointmentId);
    return { success: true };
  }
}
