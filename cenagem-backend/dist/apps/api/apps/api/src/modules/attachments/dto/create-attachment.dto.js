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
exports.CreateAttachmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateAttachmentDto {
    familyId;
    memberId;
    studyId;
    fileName;
    contentType;
    category;
    description;
    tags;
    metadata;
    base64Data;
}
exports.CreateAttachmentDto = CreateAttachmentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Identificador de la familia (se puede inferir desde la ruta)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Miembro asociado al adjunto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estudio asociado al adjunto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "studyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de archivo original' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo MIME del archivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.AttachmentCategory,
        default: client_1.AttachmentCategory.OTHER,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AttachmentCategory),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descripción breve del archivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Etiquetas asociadas',
        maxItems: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], CreateAttachmentDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadatos adicionales', type: Object }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAttachmentDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Contenido codificado en base64' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "base64Data", void 0);
//# sourceMappingURL=create-attachment.dto.js.map