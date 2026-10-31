import type { DTypeOf } from '../../core';
import type { SyncChangeSchema, SyncPullQuerySchema, SyncPullResponseSchema } from '../../definitions/apis/sync';

export interface SyncChange extends DTypeOf<typeof SyncChangeSchema> {}
export interface SyncPullQuery extends DTypeOf<typeof SyncPullQuerySchema> {}
export interface SyncPullResponse extends DTypeOf<typeof SyncPullResponseSchema> {}
