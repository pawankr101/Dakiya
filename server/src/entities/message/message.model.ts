import type { Static } from "typebox";
import type { MediaSchema, MessageEditSchema, MessageReactionSchema, MessageSchema } from "./message.schema";

export interface Message extends Static<typeof MessageSchema> { }
export interface MessageEdit extends Static<typeof MessageEditSchema> { }
export interface MessageReaction extends Static<typeof MessageReactionSchema> { }
export interface Media extends Static<typeof MediaSchema> { }
