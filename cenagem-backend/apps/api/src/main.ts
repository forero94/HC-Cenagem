import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const payloadLimit = configService.get<string>('payloadLimit') ?? '12mb';
  app.use(json({ limit: payloadLimit }));
  app.use(urlencoded({ limit: payloadLimit, extended: true }));

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CENAGEM API')
    .setDescription(
      'API para la plataforma de registro y seguimiento de casos CENAGEM.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('port') ?? 3000;

  await app.listen(port, '0.0.0.0');
  logger.log(`Server ready on http://localhost:${port}`);
  logger.log(`OpenAPI docs available at http://localhost:${port}/docs`);
}
void bootstrap();
