import {
  Injectable,
  INestApplication,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await super.$connect();
    this.logger.log('Prisma connection established');
  }

  async onModuleDestroy() {
    await super.$disconnect();
    this.logger.log('Prisma connection closed');
  }

  enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, () => {
      this.logger.log('Application shutting down, closing Prisma connection');
      void app.close();
    });
  }
}
