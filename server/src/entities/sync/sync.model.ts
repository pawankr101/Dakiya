import type { Static } from "typebox";
import type { DatabaseChangesSchema, PullQuerySchema, PushBodySchema } from "./sync.schema";

export interface DatabaseChanges extends Static<typeof DatabaseChangesSchema> { }
export interface PullQuery extends Static<typeof PullQuerySchema> { }
export interface PushBody extends Static<typeof PushBodySchema> { }
