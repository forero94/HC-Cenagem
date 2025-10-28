import { Module } from '@nestjs/common';
import { PrismaModule } from '@infrastructure/database';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { FamilyAppointmentsController } from './family-appointments.controller';

@Module({
  imports: [PrismaModule],
  providers: [AppointmentsService],
  controllers: [AppointmentsController, FamilyAppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
