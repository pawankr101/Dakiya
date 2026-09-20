import { DType } from '../../schema';

export const TextContentSchema = DType.Object({
    text: DType.String()
}, { $id: 'TextContentSchema' });

export const ImageContentSchema = DType.Object({
    filePath: DType.String(),
    blurHash: DType.Optional(DType.String()),
    size: DType.Number(),
    width: DType.Number(),
    height: DType.Number(),
    caption: DType.Optional(DType.String())
}, { $id: 'ImageContentSchema' });

export const VideoContentSchema = DType.Object({
    filePath: DType.String(),
    thumbnailPath: DType.Optional(DType.String()),
    blurHash: DType.Optional(DType.String()),
    size: DType.Number(),
    width: DType.Number(),
    height: DType.Number(),
    duration: DType.Number(),
    caption: DType.Optional(DType.String())
}, { $id: 'VideoContentSchema' });

export const AudioContentSchema = DType.Object({
    filePath: DType.String(),
    size: DType.Number(),
    duration: DType.Number(),
    caption: DType.Optional(DType.String())
}, { $id: 'AudioContentSchema' });

export const DocumentContentSchema = DType.Object({
    filePath: DType.String(),
    mimeType: DType.Optional(DType.String()),
    size: DType.Number(),
    caption: DType.Optional(DType.String())
}, { $id: 'DocumentContentSchema' });

export const ContactContentSchema = DType.Object({
    name: DType.Optional(DType.String()),
    phone: DType.Optional(DType.String()),
    email: DType.Optional(DType.String()),
    address: DType.Optional(DType.String()),
    vcard: DType.Optional(DType.String())
}, { $id: 'ContactContentSchema' });

export const LocationContentSchema = DType.Object({
    latitude: DType.Number(),
    longitude: DType.Number(),
    locationName: DType.Optional(DType.String())
}, { $id: 'LocationContentSchema' });

export const PollContentSchema = DType.Object({
    pollQuestion: DType.String(),
    pollOptions: DType.Array(DType.String()),
    pollMultipleAnswers: DType.Boolean(),
    pollExpiresAt: DType.Optional(DType.String({ format: 'date-time' }))
}, { $id: 'PollContentSchema' });

export const EventContentSchema = DType.Object({
    eventTitle: DType.String(),
    eventDescription: DType.Optional(DType.String()),
    eventLocation: DType.Optional(DType.String()),
    eventStartTime: DType.String({ format: 'date-time' }),
    eventEndTime: DType.Optional(DType.String({ format: 'date-time' }))
}, { $id: 'EventContentSchema' });

export const SystemContentSchema = DType.Object({
    eventKey: DType.String(),
    actorId: DType.Optional(DType.Uuid()),
    targetId: DType.Optional(DType.Uuid()),
    value: DType.Optional(DType.String())
}, { $id: 'SystemContentSchema' });

export const DeleteContentSchema = DType.Object({
    deletedBy: DType.Uuid(),
    reasonForDeletion: DType.Optional(DType.String())
}, { $id: 'DeleteContentSchema' });

export const MessageSchema = DType.DbTable(DType.Intersection([
    DType.Object({
        rootId: DType.Uuid(),
        version: DType.Number({ default: 0 }),
        conversationId: DType.Uuid(),
        senderId: DType.Optional(DType.Uuid()),
        replyToMessageId: DType.Optional(DType.Uuid()),
        messageGroupId: DType.Optional(DType.Uuid()),
        messageGroupPosition: DType.Optional(DType.Number()),
        isForwarded: DType.Boolean({ default: false })
    }),
    DType.Union([
        DType.Object({ type: DType.Literal('text'), content: DType.JsonB(TextContentSchema) }),
        DType.Object({ type: DType.Literal('image'), content: DType.JsonB(ImageContentSchema) }),
        DType.Object({ type: DType.Literal('video'), content: DType.JsonB(VideoContentSchema) }),
        DType.Object({ type: DType.Literal('audio'), content: DType.JsonB(AudioContentSchema) }),
        DType.Object({ type: DType.Literal('document'), content: DType.JsonB(DocumentContentSchema) }),
        DType.Object({ type: DType.Literal('contact'), content: DType.JsonB(ContactContentSchema) }),
        DType.Object({ type: DType.Literal('location'), content: DType.JsonB(LocationContentSchema) }),
        DType.Object({ type: DType.Literal('poll'), content: DType.JsonB(PollContentSchema) }),
        DType.Object({ type: DType.Literal('event'), content: DType.JsonB(EventContentSchema) }),
        DType.Object({ type: DType.Literal('system'), content: DType.JsonB(SystemContentSchema) }),
        DType.Object({ type: DType.Literal('delete'), content: DType.JsonB(DeleteContentSchema) }),
    ])
]), { $id: 'MessageSchema' });

export const MessageReactionSchema = DType.DbTable(DType.Object({
    messageRootId: DType.Uuid(),
    messageId: DType.Uuid(),
    userId: DType.Uuid(),
    reaction: DType.String(),
    isRemoved: DType.Boolean({ default: false })
}), { $id: 'MessageReactionSchema' });
