import { type TSchema, Type } from 'typebox';
import { ConversationMemberSchema, ConversationSchema, DeliveryQueueItemSchema, DeviceSchema, MediaSchema, MessageEditSchema, MessageReactionSchema, MessageSchema, UserSchema, UserSettingsSchema } from '../schemas.js';

function makeTableChangeSetSchema<T extends TSchema>(itemSchema: T) {
	return Type.Object({
		created: Type.Array(itemSchema),
		updated: Type.Array(itemSchema),
		deleted: Type.Array(Type.String({ format: 'uuid' }))
	});
}

export const DatabaseChangesSchema = Type.Object({
    users: makeTableChangeSetSchema(UserSchema),
    use_settings: makeTableChangeSetSchema(UserSettingsSchema),
	devices: makeTableChangeSetSchema(DeviceSchema),
	conversations: makeTableChangeSetSchema(ConversationSchema),
	conversation_members: makeTableChangeSetSchema(ConversationMemberSchema),
    messages: makeTableChangeSetSchema(MessageSchema),
    message_reactions: makeTableChangeSetSchema(MessageReactionSchema),
    message_edits: makeTableChangeSetSchema(MessageEditSchema),
    media: makeTableChangeSetSchema(MediaSchema),
	delivery_queue: makeTableChangeSetSchema(DeliveryQueueItemSchema)
});
