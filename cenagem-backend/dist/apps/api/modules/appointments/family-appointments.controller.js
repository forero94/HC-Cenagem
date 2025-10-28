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
exports.FamilyAppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const appointments_service_1 = require("./appointments.service");
const list_appointments_query_1 = require("./dto/list-appointments.query");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
let FamilyAppointmentsController = class FamilyAppointmentsController {
    appointments;
    constructor(appointments) {
        this.appointments = appointments;
    }
    listByFamily(familyId, query) {
        return this.appointments.listForFamily(familyId, query);
    }
    createForFamily(familyId, body) {
        return this.appointments.createForFamily(familyId, body);
    }
};
exports.FamilyAppointmentsController = FamilyAppointmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar turnos de una familia' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Turnos listados' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_appointments_query_1.ListAppointmentsQueryDto]),
    __metadata("design:returntype", void 0)
], FamilyAppointmentsController.prototype, "listByFamily", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un turno para una familia' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Turno creado' }),
    __param(0, (0, common_1.Param)('familyId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], FamilyAppointmentsController.prototype, "createForFamily", null);
exports.FamilyAppointmentsController = FamilyAppointmentsController = __decorate([
    (0, swagger_1.ApiTags)('appointments'),
    (0, common_1.Controller)({
        path: 'families/:familyId/appointments',
        version: '1',
    }),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], FamilyAppointmentsController);
//# sourceMappingURL=family-appointments.controller.js.map