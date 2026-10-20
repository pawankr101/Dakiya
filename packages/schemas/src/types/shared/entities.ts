import type { DTypeOf } from '../../core/schema';
import type {
    AudioContentSchema,
    ChannelMetadataSchema,
    ContactContentSchema,
    ConversationMemberChatPrefsSchema,
    DeleteContentSchema,
    DeviceChatPrefsSchema,
    DocumentContentSchema,
    EventContentSchema,
    GroupMetadataSchema,
    ImageContentSchema,
    LabelsAndCirclesSchema,
    LocationContentSchema,
    MessageExclusionSchema,
    MessageReactionSchema,
    MessageSchema,
    PollContentSchema,
    SystemContentSchema,
    SystemMetadataSchema,
    TextContentSchema,
    UserSettingsAccountSchema,
    UserSettingsBackupSchema,
    UserSettingsPrivacySchema,
    VideoContentSchema
} from '../../definitions/shared/entities';

export interface LabelsAndCircles extends DTypeOf<typeof LabelsAndCirclesSchema> { }
export interface DeviceChatPrefs extends DTypeOf<typeof DeviceChatPrefsSchema> { }
export interface UserSettingsPrivacy extends DTypeOf<typeof UserSettingsPrivacySchema> { }
export interface UserSettingsBackup extends DTypeOf<typeof UserSettingsBackupSchema> { }
export interface UserSettingsAccount extends DTypeOf<typeof UserSettingsAccountSchema> { }

export interface GroupMetadata extends DTypeOf<typeof GroupMetadataSchema> { }
export interface ChannelMetadata extends DTypeOf<typeof ChannelMetadataSchema> { }
export interface SystemMetadata extends DTypeOf<typeof SystemMetadataSchema> { }
export interface ConversationMemberChatPrefs extends DTypeOf<typeof ConversationMemberChatPrefsSchema> { }

export interface TextContent extends DTypeOf<typeof TextContentSchema> { }
export interface ImageContent extends DTypeOf<typeof ImageContentSchema> { }
export interface VideoContent extends DTypeOf<typeof VideoContentSchema> { }
export interface AudioContent extends DTypeOf<typeof AudioContentSchema> { }
export interface DocumentContent extends DTypeOf<typeof DocumentContentSchema> { }
export interface ContactContent extends DTypeOf<typeof ContactContentSchema> { }
export interface LocationContent extends DTypeOf<typeof LocationContentSchema> { }
export interface PollContent extends DTypeOf<typeof PollContentSchema> { }
export interface EventContent extends DTypeOf<typeof EventContentSchema> { }
export interface SystemContent extends DTypeOf<typeof SystemContentSchema> { }
export interface DeleteContent extends DTypeOf<typeof DeleteContentSchema> { }
export type Message = DTypeOf<typeof MessageSchema>;
export interface MessageExclusion extends DTypeOf<typeof MessageExclusionSchema> { }
export interface MessageReaction extends DTypeOf<typeof MessageReactionSchema> { }
