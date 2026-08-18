import type { Static } from "typebox";
import type { MessageExclusionSchema, MessageReactionSchema, MessageSchema } from "./message.schema";

export type Message = Static<typeof MessageSchema>;
export interface MessageExclusion extends Static<typeof MessageExclusionSchema> { }
export interface MessageReaction extends Static<typeof MessageReactionSchema> { }
