"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEnv = void 0;
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable ${name}. Inject JWT secrets via your KeyVault/KMS pipeline before starting the API.`);
    }
    return value;
};
exports.requireEnv = requireEnv;
//# sourceMappingURL=env.utils.js.map