"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    payloadLimit: process.env.API_PAYLOAD_LIMIT ?? '12mb',
});
//# sourceMappingURL=app.config.js.map