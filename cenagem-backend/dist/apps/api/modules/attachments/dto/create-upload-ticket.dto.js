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
exports.CreateUploadTicketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateUploadTicketDto {
    category;
    memberId;
    expiresInMinutes;
}
exports.CreateUploadTicketDto = CreateUploadTicketDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Categoría de adjunto a la que se asociará el ticket.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUploadTicketDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Integrante específico al que se asociará el ticket.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateUploadTicketDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Minutos de vigencia del ticket (1 a 180).',
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateUploadTicketDto.prototype, "expiresInMinutes", void 0);
//# sourceMappingURL=create-upload-ticket.dto.js.map