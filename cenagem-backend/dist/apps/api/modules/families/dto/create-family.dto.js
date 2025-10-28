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
exports.CreateFamilyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class FamilyMotiveDto {
    groupId;
    groupLabel;
    detailId;
    detailLabel;
    motiveNotes;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Identificador del grupo de motivo de consulta',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], FamilyMotiveDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Etiqueta legible del grupo de motivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], FamilyMotiveDto.prototype, "groupLabel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Identificador del motivo específico' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], FamilyMotiveDto.prototype, "detailId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Etiqueta legible del motivo específico',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], FamilyMotiveDto.prototype, "detailLabel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notas internas sobre el motivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FamilyMotiveDto.prototype, "motiveNotes", void 0);
class CreateFamilyDto {
    code;
    displayName;
    status;
    province;
    city;
    address;
    tags;
    motive;
    motiveNarrative;
    motivePatient;
    motiveDerivation;
    contactInfo;
    consanguinity;
    obstetricHistory;
    grandparents;
    intake;
    metadata;
}
exports.CreateFamilyDto = CreateFamilyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código único de la historia clínica familiar',
        example: 'AG-0001',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre breve para identificar a la familia',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.FamilyStatus, default: client_1.FamilyStatus.ACTIVE }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.FamilyStatus),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Provincia o jurisdicción de residencia principal',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ciudad de residencia' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dirección de contacto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(250),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Etiquetas libres asociadas',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateFamilyDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: FamilyMotiveDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FamilyMotiveDto),
    __metadata("design:type", FamilyMotiveDto)
], CreateFamilyDto.prototype, "motive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Narrativa clínica principal del caso' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "motiveNarrative", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Motivo de consulta aportado por el paciente/familia',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "motivePatient", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Motivo de derivación institucional' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "motiveDerivation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Información de contacto (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "contactInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Información de consanguinidad (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "consanguinity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Antecedentes obstétricos (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "obstetricHistory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Información de abuelos (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "grandparents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Datos administrativos de intake (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "intake", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadatos adicionales (estructura libre)',
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFamilyDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-family.dto.js.map