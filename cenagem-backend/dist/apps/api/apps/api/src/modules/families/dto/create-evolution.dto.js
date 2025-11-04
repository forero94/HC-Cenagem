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
exports.CreateEvolutionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateEvolutionDto {
    note;
    authorName;
    authorEmail;
    recordedAt;
}
exports.CreateEvolutionDto = CreateEvolutionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Texto de la evolución registrada' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvolutionDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre de quien registra la evolución' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateEvolutionDto.prototype, "authorName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Identificador de quien registra (correo o usuario)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateEvolutionDto.prototype, "authorEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fecha de registro (por defecto se usa el momento actual)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEvolutionDto.prototype, "recordedAt", void 0);
//# sourceMappingURL=create-evolution.dto.js.map