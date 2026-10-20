import type { HttpCode } from "@dakiya/utils";

export interface ApiPagination {
    cursor: string;
    hasMore: boolean;
}

export class ApiResponse<T = unknown> {
    public readonly pagination?: ApiPagination;
    public readonly meta?: Record<string, unknown>;

    /**
     * @param status The HTTP status code (e.g., 200, 201, 202).
     * @param data The main payload. Mapped directly to the 'data' property in the JSON envelope.
     * @param options Optional pagination and metadata.
     */
    constructor(
        public readonly status: HttpCode,
        public readonly data: T | null,
        options?: { pagination?: ApiPagination; meta?: Record<string, unknown> }
    ) {
        const { pagination, meta } = options ?? {};
        if (pagination) this.pagination = pagination;
        if (meta) this.meta = meta;
    }
}
