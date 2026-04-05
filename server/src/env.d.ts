export interface Env {
    // Server configuration
    DAKIYA_SERVER_HOST: string;
    DAKIYA_SERVER_PORT: string;

    // JWT configuration
    DAKIYA_JWT_SECRET: string;

    // Database configuration
    DAKIYA_DB_HOST: string;
    DAKIYA_DB_PORT: string;
    DAKIYA_DB_DATABASE: string;
    DAKIYA_DB_USER: string;
    DAKIYA_DB_PASSWORD: string;

    // Cache configuration
    DAKIYA_CACHE_HOST: string;
    DAKIYA_CACHE_PORT: string;
    DAKIYA_CACHE_DATABASE: string;
    DAKIYA_CACHE_USER: string;
    DAKIYA_CACHE_PASSWORD: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends Env {}
    }
}
