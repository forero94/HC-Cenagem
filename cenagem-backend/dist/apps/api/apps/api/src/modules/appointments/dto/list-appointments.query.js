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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppointmentsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ListAppointmentsQueryDto {
    familyId;
    memberId;
    date;
    from;
    to;
    status;
    limit = 50;
    cursor;
}
exports.ListAppointmentsQueryDto = ListAppointmentsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrar por familia' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrar por miembro' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrar por día exacto (ISO YYYY-MM-DD)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fecha inicial (inclusive) para filtrar por rango',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fecha final (inclusive) para filtrar por rango',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AppointmentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AppointmentStatus),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cantidad máxima de turnos',
        default: 50,
        minimum: 1,
        maximum: 200,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Object)
], ListAppointmentsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cursor de paginación basado en el ID',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAppointmentsQueryDto.prototype, "cursor", void 0);
//# sourceMappingURL=list-appointments.query.js.map