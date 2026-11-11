import type { DTypeOf } from '../../core';
import type { SystemHealthSuccessSchema, SystemTimeResponseSchema } from '../../definitions/apis/system';

export interface SystemHealthSuccess extends DTypeOf<typeof SystemHealthSuccessSchema> {}
export interface SystemTimeResponse extends DTypeOf<typeof SystemTimeResponseSchema> {}
