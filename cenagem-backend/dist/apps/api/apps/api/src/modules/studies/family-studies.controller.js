"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyStudiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const studies_service_1 = require("./studies.service");
const list_studies_query_1 = require("./dto/list-studies.query");
const create_study_dto_1 = require("./dto/create-study.dto");
let FamilyStudiesController = class FamilyStudiesController {
    studies;
    constructor(studies) {
        this.studies = studies;
    }
    list(familyId, query) {
        return this.studies.listForFamily(familyId, query);
    }
    create(familyId, body) {
        return this.studies.createForFamily(familyId, body);
    }
};
exports.FamilyStudiesController = FamilyStudiesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar estudios de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Estudios listados' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_studies_query_1.ListStudiesQueryDto]),
    __metadata("design:returntype", void 0)
], FamilyStudiesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un estudio para una familia' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Estudio creado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_study_dto_1.CreateStudyDto]),
    __metadata("design:returntype", void 0)
], FamilyStudiesController.prototype, "create", null);
exports.FamilyStudiesController = FamilyStudiesController = __decorate([
    (0, swagger_1.ApiTags)('studies'),
    (0, common_1.Controller)({
        path: 'families/:familyId/studies',
        version: '1',
    }),
    __metadata("design:paramtypes", [studies_service_1.StudiesService])
], FamilyStudiesController);
//# sourceMappingURL=family-studies.controller.js.map