import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

@ApiTags('appointments')
@Controller({
  path: 'families/:familyId/appointments',
  version: '1',
})
export class FamilyAppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turnos de una familia' })
  @ApiOkResponse({ description: 'Turnos listados' })
  listByFamily(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Query() query: ListAppointmentsQueryDto,
  ) {
    return this.appointments.listForFamily(familyId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un turno para una familia' })
  @ApiCreatedResponse({ description: 'Turno creado' })
  createForFamily(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateAppointmentDto,
  ) {
    return this.appointments.createForFamily(familyId, body);
  }
}
