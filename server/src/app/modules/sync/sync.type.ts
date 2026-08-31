import type { Static } from "typebox";
import type { PullChangesQuerySchema, PullChangesSuccessSchema } from "./sync.schema";

export interface PullChangesQuery extends Static<typeof PullChangesQuerySchema> { }
export interface PulledChanges extends Static<typeof PullChangesSuccessSchema> { }
