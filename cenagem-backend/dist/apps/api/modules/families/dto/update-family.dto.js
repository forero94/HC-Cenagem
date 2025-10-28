"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFamilyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_family_dto_1 = require("./create-family.dto");
class UpdateFamilyDto extends (0, swagger_1.PartialType)(create_family_dto_1.CreateFamilyDto) {
}
exports.UpdateFamilyDto = UpdateFamilyDto;
//# sourceMappingURL=update-family.dto.js.map