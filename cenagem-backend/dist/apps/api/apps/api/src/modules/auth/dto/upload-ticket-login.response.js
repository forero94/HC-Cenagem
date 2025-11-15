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
exports.UploadTicketLoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const token_pair_dto_1 = require("./token-pair.dto");
class UploadTicketUserDto {
    id;
    email;
    firstName;
    lastName;
    displayName;
    primaryRole;
    licenseNumber;
    documentNumber;
    scope;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketUserDto.prototype, "primaryRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketUserDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketUserDto.prototype, "documentNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['upload-ticket'] }),
    __metadata("design:type", String)
], UploadTicketUserDto.prototype, "scope", void 0);
class UploadTicketMemberDto {
    id;
    label;
    role;
    initials;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketMemberDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketMemberDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketMemberDto.prototype, "initials", void 0);
class UploadTicketContextDto {
    id;
    familyId;
    memberId;
    expiresAt;
    familyCode;
    familyDisplayName;
    memberLabel;
    members;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketContextDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketContextDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketContextDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UploadTicketContextDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UploadTicketContextDto.prototype, "familyCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketContextDto.prototype, "familyDisplayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], UploadTicketContextDto.prototype, "memberLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UploadTicketMemberDto] }),
    __metadata("design:type", Array)
], UploadTicketContextDto.prototype, "members", void 0);
class UploadTicketLoginResponseDto {
    tokens;
    user;
    ticket;
}
exports.UploadTicketLoginResponseDto = UploadTicketLoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: token_pair_dto_1.TokenPairDto }),
    __metadata("design:type", token_pair_dto_1.TokenPairDto)
], UploadTicketLoginResponseDto.prototype, "tokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UploadTicketUserDto }),
    __metadata("design:type", UploadTicketUserDto)
], UploadTicketLoginResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UploadTicketContextDto }),
    __metadata("design:type", UploadTicketContextDto)
], UploadTicketLoginResponseDto.prototype, "ticket", void 0);
//# sourceMappingURL=upload-ticket-login.response.js.map