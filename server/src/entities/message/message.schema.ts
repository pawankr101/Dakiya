import { Type } from 'typebox';

const MessageContentSchema = Type.Object({
    // for text messages
    text: Type.Optional(Type.String()),

    // for media messages
    mediaCaption: Type.Optional(Type.String()),

    // for location messages
    latitude: Type.Optional(Type.Number()),
    longitude: Type.Optional(Type.Number()),
    locationName: Type.Optional(Type.String()),

    // for poll messages
    pollQuestion: Type.Optional(Type.String()),
    pollOptions: Type.Optional(Type.Array(Type.String())),
    pollMultipleAnswers: Type.Optional(Type.Boolean()),
    pollExpiresAt: Type.Optional(Type.String({ format: 'date-time' })),

    // for calendar event messages
    eventTitle: Type.Optional(Type.String()),
    eventDescription: Type.Optional(Type.String()),
    eventStartTime: Type.Optional(Type.String({ format: 'date-time' })),
    eventEndTime: Type.Optional(Type.String({ format: 'date-time' }))
});

const MessageTypeSchema = Type.Union([
    Type.Literal('text'),
    Type.Literal('media'),
    Type.Literal('location'),
    Type.Literal('poll'),
    Type.Literal('event')
]);

const MessageStatusSchema = Type.Union([
    Type.Literal('sent'),
    Type.Literal('delivered'),
    Type.Literal('read')
]);

const MediaParentTypeSchema = Type.Union([
    Type.Literal('message'),
    Type.Literal('user'),
    Type.Literal('conversation')
]);

const MediaTypeSchema = Type.Union([
    Type.Literal('photo'),
    Type.Literal('video'),
    Type.Literal('audio'),
    Type.Literal('document')
]);

export const MessageSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    conversationId: Type.String({ format: 'uuid' }),
    senderId: Type.String({ format: 'uuid' }),
    type: MessageTypeSchema,
    content: MessageContentSchema,
    status: MessageStatusSchema,
    sentAt: Type.String({ format: 'date-time' }),
    deliveredAt: Type.Optional(Type.String({ format: 'date-time' })),
    readAt: Type.Optional(Type.String({ format: 'date-time' })),
    replyToMessageId: Type.Optional(Type.String({ format: 'uuid' })),
    isForwarded: Type.Boolean(),
    isEncrypted: Type.Boolean(),
    encryptionAlgorithm: Type.Optional(Type.String()),
    isEdited: Type.Boolean(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
}, { $id: 'MessageSchema' });

export const MessageReactionSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    messageId: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
    reaction: Type.String(), // Emoji string
    isRemoved: Type.Boolean(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
}, { $id: 'MessageReactionSchema' });

export const MessageEditSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    messageId: Type.String({ format: 'uuid' }),
    editorId: Type.String({ format: 'uuid' }),
    previousType: MessageTypeSchema,
    previousContent: MessageContentSchema, // JSONB
    newType: MessageTypeSchema,
    newContent: MessageContentSchema,    // JSONB
    editedAt: Type.String({ format: 'date-time' }),
    createdAt: Type.String({ format: 'date-time' })
}, { $id: 'MessageEditSchema' });

export const MediaSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    parentType: MediaParentTypeSchema,
    parentId: Type.String({ format: 'uuid' }), // Foreign key to Message, User, or Conv
    type: MediaTypeSchema,
    fileName: Type.Optional(Type.String()),
    remotePath: Type.String(),
    mimeType: Type.Optional(Type.String()),
    size: Type.Number(),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
    duration: Type.Optional(Type.Number()),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
}, { $id: 'MediaSchema' });
