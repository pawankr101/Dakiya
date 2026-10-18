import type { DTypeOf } from '../../core';
import type { SyncPullQuerySchema, SyncPullResponseSchema } from '../../definitions/apis/sync';

export interface SyncPullQuery extends DTypeOf<typeof SyncPullQuerySchema> {}
export interface SyncPullResponse extends DTypeOf<typeof SyncPullResponseSchema> {}
