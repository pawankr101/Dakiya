import type { Static } from "typebox";
import type { DatabaseChangesSchema } from "./sync.schema";

export interface DatabaseChanges extends Static<typeof DatabaseChangesSchema> { }
