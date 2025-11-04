"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamiliesModule = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
const families_controller_1 = require("./families.controller");
const families_service_1 = require("./services/families.service");
const family_members_service_1 = require("./services/family-members.service");
const family_evolutions_service_1 = require("./services/family-evolutions.service");
const family_attachments_service_1 = require("./services/family-attachments.service");
const family_mapper_service_1 = require("./services/family-mapper.service");
let FamiliesModule = class FamiliesModule {
};
exports.FamiliesModule = FamiliesModule;
exports.FamiliesModule = FamiliesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_1.PrismaModule],
        controllers: [families_controller_1.FamiliesController],
        providers: [
            family_mapper_service_1.FamilyMapper,
            family_attachments_service_1.FamilyAttachmentsService,
            family_members_service_1.FamilyMembersService,
            family_evolutions_service_1.FamilyEvolutionsService,
            families_service_1.FamiliesService,
        ],
        exports: [
            families_service_1.FamiliesService,
            family_members_service_1.FamilyMembersService,
            family_evolutions_service_1.FamilyEvolutionsService,
            family_attachments_service_1.FamilyAttachmentsService,
        ],
    })
], FamiliesModule);
//# sourceMappingURL=families.module.js.map