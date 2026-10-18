import { type DSchema, DType, } from "../../core";
import { ConversationMemberSchema, ConversationSchema, UserRelationshipSchema, UserSchema } from "../server";
import { MessageReactionSchema, MessageSchema } from "../shared";
import { ApiSchema } from "./api";

const makePullChangeSetSchema = <T extends DSchema>(itemSchema: T) => {
    return DType.Optional(DType.Object({
        modified: DType.Array(itemSchema),
        deleted: DType.Array(DType.Uuid())
    }));
};

const SyncPullChangeSchema = DType.Object({
    users: makePullChangeSetSchema(UserSchema),
    user_relationships: makePullChangeSetSchema(UserRelationshipSchema),
    conversations: makePullChangeSetSchema(ConversationSchema),
    conversation_members: makePullChangeSetSchema(ConversationMemberSchema),
    messages: makePullChangeSetSchema(MessageSchema),
    message_reactions: makePullChangeSetSchema(MessageReactionSchema)
});

export const SyncPullResponseSchema = ApiSchema.success(SyncPullChangeSchema, {
    $id: 'SyncPullResponseSchema',
    pagination: true
});

export const SyncPullQuerySchema = ApiSchema.query({
    last_hlc: DType.Optional(DType.String())
}, { $id: 'SyncPullQuerySchema' });
