import type { DTypeOf } from '../../core';
import type { SystemHealthErrorSchema, SystemHealthSuccessSchema, SystemTimeResponseSchema } from '../../definitions/apis/system';

export interface SystemHealthSuccess extends DTypeOf<typeof SystemHealthSuccessSchema> {}
export interface SystemHealthError extends DTypeOf<typeof SystemHealthErrorSchema> {}
export interface SystemTimeResponse extends DTypeOf<typeof SystemTimeResponseSchema> {}
