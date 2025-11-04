"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const app_module_1 = require("./app/app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    const logger = new common_1.Logger('Bootstrap');
    const configService = app.get(config_1.ConfigService);
    const payloadLimit = configService.get('payloadLimit') ?? '12mb';
    app.use((0, express_1.json)({ limit: payloadLimit }));
    app.use((0, express_1.urlencoded)({ limit: payloadLimit, extended: true }));
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('CENAGEM API')
        .setDescription('API para la plataforma de registro y seguimiento de casos CENAGEM.')
        .setVersion('1.0.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = configService.get('port') ?? 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Server ready on http://localhost:${port}`);
    logger.log(`OpenAPI docs available at http://localhost:${port}/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map