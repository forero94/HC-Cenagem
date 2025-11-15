"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_utils_1 = require("./env.utils");
exports.default = () => {
    const accessSecret = (0, env_utils_1.requireEnv)('JWT_ACCESS_SECRET');
    const refreshSecret = (0, env_utils_1.requireEnv)('JWT_REFRESH_SECRET');
    return {
        auth: {
            access: {
                secret: accessSecret,
                expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
            },
            refresh: {
                secret: refreshSecret,
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
            },
        },
    };
};
//# sourceMappingURL=auth.config.js.map