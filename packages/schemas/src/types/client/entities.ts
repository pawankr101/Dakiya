import type { DTypeOf } from '../../core';
import type {
    ClientConversationMemberSchema,
    ClientConversationSchema,
    ClientUserSchema,
    ClientUserSettingsNotificationsSchema,
    ProfileDevicesSchema,
    ProfileInfoSchema,
    ProfileRelationshipsSchema,
    ProfileSchema,
    ProfileSettingsSchema
} from '../../definitions/client/entities';

export interface ProfileInfo extends DTypeOf<typeof ProfileInfoSchema> { }
export interface ClientUserSettingsNotifications extends DTypeOf<typeof ClientUserSettingsNotificationsSchema> { }
export interface ProfileSettings extends DTypeOf<typeof ProfileSettingsSchema> { }
export interface ProfileDevices extends DTypeOf<typeof ProfileDevicesSchema> { }
export interface ProfileRelationships extends DTypeOf<typeof ProfileRelationshipsSchema> { }
export interface Profile extends DTypeOf<typeof ProfileSchema> { }
export interface ClientUser extends DTypeOf<typeof ClientUserSchema> { }

export type ClientConversation = DTypeOf<typeof ClientConversationSchema>;
export interface ClientConversationMember extends DTypeOf<typeof ClientConversationMemberSchema> { }
