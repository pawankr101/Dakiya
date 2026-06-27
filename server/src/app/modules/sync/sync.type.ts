import type { Static } from "typebox";
import type { DatabaseChangesSchema, PullChangesQuerySchema, PullChangesSuccessSchema } from "./sync.schema";

export interface PullChangesQuery extends Static<typeof PullChangesQuerySchema> { }
export interface PulledChanges extends Static<typeof PullChangesSuccessSchema> { }
export interface DatabaseChanges extends Static<typeof DatabaseChangesSchema> { }
