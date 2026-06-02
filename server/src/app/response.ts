import type { HttpCode } from "@dakiya/shared";

export class ApiResponse<T = unknown> {
    /**
     * @param status The HTTP status code (e.g., 200, 201, 202).
     * @param data The main payload. Mapped directly to the 'data' property in the JSON envelope.
     * @param meta Optional metadata. Perfect for pagination (e.g., { total: 100, page: 1 }).
     */
    constructor(
        public readonly status: HttpCode,
        public readonly data: T | null,
        public readonly meta?: Record<string, unknown>
    ) {}
}
