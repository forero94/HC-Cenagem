import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../apps/api/src/app/app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('CENAGEM API')
    .setDescription('API para la plataforma de registro y seguimiento de casos CENAGEM.')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputDir = join(__dirname, '..', 'openapi');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'cenagem-api.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');
  await app.close();

  // eslint-disable-next-line no-console
  console.log(`OpenAPI document generated at ${outputPath}`);
}

generateOpenApi().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI document', error);
  process.exit(1);
});
