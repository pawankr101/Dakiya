import type { FastifySchema } from 'fastify';
import { type TSchema, Type } from 'typebox';
import { buildApiErrorSchema, buildApiResponseSchema } from '../../schema.js';

const TAGS = ['Synchronization'] as const;

const makeTableChangeSetSchema = <T extends TSchema>(itemSchema: T) => {
	return Type.Optional(Type.Object({
		created: Type.Array(itemSchema),
		updated: Type.Array(itemSchema),
		deleted: Type.Array(Type.String({ format: 'uuid' }))
	}));
}

export const DatabaseChangesSchema = Type.Object({
    users: makeTableChangeSetSchema(Type.Ref('UserSchema')),
    use_settings: makeTableChangeSetSchema(Type.Ref('UserSettingsSchema')),
	devices: makeTableChangeSetSchema(Type.Ref('DeviceSchema')),
	conversations: makeTableChangeSetSchema(Type.Ref('ConversationSchema')),
	conversation_members: makeTableChangeSetSchema(Type.Ref('ConversationMemberSchema')),
    messages: makeTableChangeSetSchema(Type.Ref('MessageSchema')),
    message_reactions: makeTableChangeSetSchema(Type.Ref('MessageReactionSchema')),
    message_edits: makeTableChangeSetSchema(Type.Ref('MessageEditSchema')),
    media: makeTableChangeSetSchema(Type.Ref('MediaSchema'))
});

export const PullChangesQuerySchema = Type.Object({
    last_pulled_at: Type.Optional(Type.Number())
});

export const PullChangesSuccessSchema = Type.Object({
    lastPulledAt: Type.Number(),
    changes: DatabaseChangesSchema
});

const PushBodySchema = Type.Object({
    changes: DatabaseChangesSchema,
    last_pulled_at: Type.Number()
});

export const PullChangesSchema: FastifySchema = {
    summary: 'Pull changes',
    description: 'Pull changes from the server since the last pull time.',
    tags: TAGS,
    querystring: PullChangesQuerySchema,
    response: {
        200: buildApiResponseSchema(PullChangesSuccessSchema),
        400: buildApiErrorSchema(Type.Array(Type.Object({
            field: Type.String(),
            message: Type.String()
        }))),
        401: buildApiErrorSchema(),
        404: buildApiErrorSchema(),
        500: buildApiErrorSchema()
    }
};

export const PushChangesSchema: FastifySchema = {
    summary: 'Push changes',
    description: 'Push local changes to the server and receive any new changes since the last pull time.',
    tags: TAGS,
    body: PushBodySchema,
    response: {
        200: buildApiResponseSchema(Type.Object({
            message: Type.String(),
            changes: DatabaseChangesSchema
        })),
        400: buildApiErrorSchema(Type.Array(Type.Object({
            field: Type.String(),
            message: Type.String()
        }))),
        401: buildApiErrorSchema(),
        404: buildApiErrorSchema(),
        500: buildApiErrorSchema()
    }
};
