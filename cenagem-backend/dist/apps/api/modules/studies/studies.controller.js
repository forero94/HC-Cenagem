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
exports.StudiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const studies_service_1 = require("./studies.service");
const list_studies_query_1 = require("./dto/list-studies.query");
const create_study_dto_1 = require("./dto/create-study.dto");
const update_study_dto_1 = require("./dto/update-study.dto");
let StudiesController = class StudiesController {
    studies;
    constructor(studies) {
        this.studies = studies;
    }
    list(query) {
        return this.studies.listStudies(query);
    }
    create(body) {
        return this.studies.create(body);
    }
    getById(studyId) {
        return this.studies.getById(studyId);
    }
    update(studyId, body) {
        return this.studies.update(studyId, body);
    }
    async delete(studyId) {
        await this.studies.remove(studyId);
        return { success: true };
    }
};
exports.StudiesController = StudiesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar estudios' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Listado de estudios' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_studies_query_1.ListStudiesQueryDto]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un estudio' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Estudio creado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_study_dto_1.CreateStudyDto]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':studyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un estudio' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Estudio encontrado' }),
    __param(0, (0, common_1.Param)('studyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':studyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un estudio' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Estudio actualizado' }),
    __param(0, (0, common_1.Param)('studyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_study_dto_1.UpdateStudyDto]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':studyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un estudio' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Estudio eliminado' }),
    __param(0, (0, common_1.Param)('studyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "delete", null);
exports.StudiesController = StudiesController = __decorate([
    (0, swagger_1.ApiTags)('studies'),
    (0, common_1.Controller)({
        path: 'studies',
        version: '1',
    }),
    __metadata("design:paramtypes", [studies_service_1.StudiesService])
], StudiesController);
//# sourceMappingURL=studies.controller.js.map