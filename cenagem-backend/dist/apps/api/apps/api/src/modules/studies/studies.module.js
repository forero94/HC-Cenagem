"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudiesModule = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../../../../libs/infrastructure/src/database");
const studies_service_1 = require("./studies.service");
const studies_controller_1 = require("./studies.controller");
const family_studies_controller_1 = require("./family-studies.controller");
let StudiesModule = class StudiesModule {
};
exports.StudiesModule = StudiesModule;
exports.StudiesModule = StudiesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_1.PrismaModule],
        providers: [studies_service_1.StudiesService],
        controllers: [studies_controller_1.StudiesController, family_studies_controller_1.FamilyStudiesController],
        exports: [studies_service_1.StudiesService],
    })
], StudiesModule);
//# sourceMappingURL=studies.module.js.map