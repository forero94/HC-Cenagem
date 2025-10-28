"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./audit/audit.module"), exports);
__exportStar(require("./auth/auth.module"), exports);
__exportStar(require("./appointments/appointments.module"), exports);
__exportStar(require("./attachments/attachments.module"), exports);
__exportStar(require("./cases/cases.module"), exports);
__exportStar(require("./catalogue/catalogue.module"), exports);
__exportStar(require("./families/families.module"), exports);
__exportStar(require("./health/health.module"), exports);
__exportStar(require("./notifications/notifications.module"), exports);
__exportStar(require("./roles/roles.module"), exports);
__exportStar(require("./users/users.module"), exports);
__exportStar(require("./studies/studies.module"), exports);
//# sourceMappingURL=index.js.map