import type { HttpCode } from "@dakiya/utils";
import type { ApiResponse as IApiResponse } from "../schemas";

export interface ApiPagination {
    cursor: string;
    hasMore: boolean;
}

export class ApiResponse<D, M = unknown> implements IApiResponse<D, M> {
    public readonly pagination?: IApiResponse<D, M>["pagination"];
    public readonly meta?: M;

    /**
     * Creates a new ApiResponse instance.
     * @param status - The HTTP status code for the response.
     * @param data - The data payload of the response.
     * @param options - Optional parameters including pagination and meta information.
     */
    constructor(
        public readonly status: HttpCode,
        public readonly data: D,
        options?: { pagination?: IApiResponse<D, M>["pagination"]; meta?: M }
    ) {
        const { pagination, meta } = options ?? {};
        if (pagination) this.pagination = pagination;
        if (meta) this.meta = meta;
    }
}
