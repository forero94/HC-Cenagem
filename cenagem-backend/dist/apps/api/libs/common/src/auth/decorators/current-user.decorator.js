"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((property, context) => {
    const request = context
        ?.switchToHttp()
        .getRequest();
    const user = request?.user;
    if (!property) {
        return user;
    }
    return user?.[property];
});
//# sourceMappingURL=current-user.decorator.js.map