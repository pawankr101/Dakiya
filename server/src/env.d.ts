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

    // Nats configuration
    DAKIYA_NATS_HOST: string;
    DAKIYA_NATS_PORT: string;
    DAKIYA_NATS_USER: string;
    DAKIYA_NATS_PASSWORD: string;

    // Cache configuration
    DAKIYA_CACHE_DATABASE: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends Env {}
    }
}
