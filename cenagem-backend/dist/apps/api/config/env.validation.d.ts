declare class EnvironmentVariables {
    PORT: number;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
