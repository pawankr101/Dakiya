import type { FastifySchema } from 'fastify';
import { type TSchema, Type } from 'typebox';
import {
    ConversationMemberSchema,
    ConversationSchema,
    DeliveryQueueItemSchema,
    DeviceSchema,
    MediaSchema,
    MessageEditSchema,
    MessageReactionSchema,
    MessageSchema,
    UserSchema,
    UserSettingsSchema
} from '../../../entities/schemas.js';

const TAGS = ['Sync'] as const;

const makeTableChangeSetSchema = <T extends TSchema>(itemSchema: T) => {
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

const PullQuerySchema = Type.Object({
    last_pulled_at: Type.Optional(Type.String({ format: 'date-time' }))
});

const PushBodySchema = Type.Object({
    changes: DatabaseChangesSchema,
    last_pulled_at: Type.Number()
});

export const PullChangesSchema: FastifySchema = {
    tags: TAGS,
    querystring: PullQuerySchema,
    response: {
        200: Type.Object({
            message: Type.String(),
            changes: DatabaseChangesSchema
        })
    }
};

export const PushChangesSchema: FastifySchema = {
    tags: TAGS,
    body: PushBodySchema,
    response: {
        200: Type.Object({
            message: Type.String(),
            changes: DatabaseChangesSchema
        })
    }
};
