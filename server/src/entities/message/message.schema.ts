import { Type } from 'typebox';
import { DBTableSchema, UUIDSchema } from '../../schema';

const TextContentSchema = Type.Object({
    text: Type.String()
});
const ImageContentSchema = Type.Object({
    filePath: Type.String(),
    blurHash: Type.Optional(Type.String()),
    size: Type.Number(),
    width: Type.Number(),
    height: Type.Number(),
    caption: Type.Optional(Type.String())
});
const VideoContentSchema = Type.Object({
    filePath: Type.String(),
    thumbnailPath: Type.Optional(Type.String()),
    blurHash: Type.Optional(Type.String()),
    size: Type.Number(),
    width: Type.Number(),
    height: Type.Number(),
    duration: Type.Number(),
    caption: Type.Optional(Type.String())
});
const AudioContentSchema = Type.Object({
    filePath: Type.String(),
    size: Type.Number(),
    duration: Type.Number(),
    caption: Type.Optional(Type.String())
});
const DocumentContentSchema = Type.Object({
    filePath: Type.String(),
    mimeType: Type.Optional(Type.String()),
    size: Type.Number(),
    caption: Type.Optional(Type.String())
});
const ContactContentSchema = Type.Object({
    name: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    email: Type.Optional(Type.String()),
    address: Type.Optional(Type.String()),
    vcard: Type.Optional(Type.String())
});
const LocationContentSchema = Type.Object({
    latitude: Type.Number(),
    longitude: Type.Number(),
    locationName: Type.Optional(Type.String())
});
const PollContentSchema = Type.Object({
    pollQuestion: Type.String(),
    pollOptions: Type.Array(Type.String()),
    pollMultipleAnswers: Type.Boolean(),
    pollExpiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});
const EventContentSchema = Type.Object({
    eventTitle: Type.String(),
    eventDescription: Type.Optional(Type.String()),
    eventLocation: Type.Optional(Type.String()),
    eventStartTime: Type.String({ format: 'date-time' }),
    eventEndTime: Type.Optional(Type.String({ format: 'date-time' }))
});
const SystemContentSchema = Type.Object({
    eventKey: Type.String(),
    actorId: Type.Optional(UUIDSchema),
    targetId: Type.Optional(UUIDSchema),
    value: Type.Optional(Type.String())
});
const DeleteContentSchema = Type.Object({
    deletedBy: UUIDSchema,
    reasonForDeletion: Type.Optional(Type.String())
});


export const MessageSchema = Type.Intersect([
    DBTableSchema({
        rootId: UUIDSchema,
        version: Type.Number({ default: 0 }),
        conversationId: UUIDSchema,
        senderId: Type.Optional(UUIDSchema),
        replyToMessageId: Type.Optional(UUIDSchema),
        messageGroupId: Type.Optional(UUIDSchema),
        messageGroupPosition: Type.Optional(Type.Number()),
        isForwarded: Type.Boolean({ default: false })
    }),
    Type.Union([
        Type.Object({ type: Type.Literal('text'), content: TextContentSchema }),
        Type.Object({ type: Type.Literal('image'), content: ImageContentSchema }),
        Type.Object({ type: Type.Literal('video'), content: VideoContentSchema }),
        Type.Object({ type: Type.Literal('audio'), content: AudioContentSchema }),
        Type.Object({ type: Type.Literal('document'), content: DocumentContentSchema }),
        Type.Object({ type: Type.Literal('contact'), content: ContactContentSchema }),
        Type.Object({ type: Type.Literal('location'), content: LocationContentSchema }),
        Type.Object({ type: Type.Literal('poll'), content: PollContentSchema }),
        Type.Object({ type: Type.Literal('event'), content: EventContentSchema }),
        Type.Object({ type: Type.Literal('system'), content: SystemContentSchema }),
        Type.Object({ type: Type.Literal('delete'), content: DeleteContentSchema }),
    ])
], { $id: 'MessageSchema' });

export const MessageExclusionSchema = DBTableSchema({
    messageRootId: UUIDSchema,
    deletedFor: UUIDSchema,
    deletedBy: UUIDSchema
}, { $id: 'MessageExclusionSchema' });

export const MessageReactionSchema = DBTableSchema({
    messageRootId: UUIDSchema,
    messageId: UUIDSchema,
    userId: UUIDSchema,
    reaction: Type.String(),
    isRemoved: Type.Boolean({ default: false })
}, { $id: 'MessageReactionSchema' });
