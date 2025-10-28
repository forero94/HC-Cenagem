import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from '../config/app.config';
import authConfig from '../config/auth.config';
import databaseConfig from '../config/database.config';
import { validate } from '../config/env.validation';
import {
  AppointmentsModule,
  AttachmentsModule,
  AuthModule,
  CasesModule,
  CatalogueModule,
  FamiliesModule,
  HealthModule,
  NotificationsModule,
  StudiesModule,
  RolesModule,
  UsersModule,
} from '../modules';
import { PrismaModule } from '@infrastructure/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, databaseConfig, authConfig],
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CasesModule,
    CatalogueModule,
    FamiliesModule,
    AppointmentsModule,
    StudiesModule,
    AttachmentsModule,
    NotificationsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
