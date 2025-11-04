"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const app_config_1 = __importDefault(require("../config/app.config"));
const auth_config_1 = __importDefault(require("../config/auth.config"));
const database_config_1 = __importDefault(require("../config/database.config"));
const env_validation_1 = require("../config/env.validation");
const modules_1 = require("../modules");
const database_1 = require("../../../../libs/infrastructure/src/database");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: ['.env.local', '.env'],
                isGlobal: true,
                cache: true,
                expandVariables: true,
                load: [app_config_1.default, database_config_1.default, auth_config_1.default],
                validate: env_validation_1.validate,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 100,
                },
            ]),
            modules_1.HealthModule,
            modules_1.AuthModule,
            modules_1.UsersModule,
            modules_1.RolesModule,
            modules_1.CasesModule,
            modules_1.CatalogueModule,
            modules_1.FamiliesModule,
            modules_1.AppointmentsModule,
            modules_1.StudiesModule,
            modules_1.AttachmentsModule,
            modules_1.NotificationsModule,
            database_1.PrismaModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map