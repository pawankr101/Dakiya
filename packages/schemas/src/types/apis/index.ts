import type { DHlc, DTypeOf } from '../../core';
import type { ApiErrorSchema, ApiErrorWithIssuesSchema } from '../../definitions/apis';

export * from './sync';
export * from './system';
export interface ApiError extends DTypeOf<typeof ApiErrorSchema> {}
export interface ApiErrorWithIssues extends DTypeOf<typeof ApiErrorWithIssuesSchema> {}
export interface ApiResponse<D, M=unknown> {
    data: D;
    pagination?: {
        cursor: DTypeOf<DHlc>;
        hasMore: boolean;
    };
    meta?: M;
}
