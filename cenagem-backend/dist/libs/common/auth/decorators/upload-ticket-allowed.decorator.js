"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadTicketAllowed = void 0;
const common_1 = require("@nestjs/common");
const auth_constants_1 = require("../auth.constants");
const UploadTicketAllowed = () => (0, common_1.SetMetadata)(auth_constants_1.UPLOAD_TICKET_ALLOWED_KEY, true);
exports.UploadTicketAllowed = UploadTicketAllowed;
//# sourceMappingURL=upload-ticket-allowed.decorator.js.map