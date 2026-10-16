import type { DTypeOf } from '../../core/schema';
import type { ProfileSchema } from '../../definitions/client/entities';

export interface Profile extends DTypeOf<typeof ProfileSchema> { }
