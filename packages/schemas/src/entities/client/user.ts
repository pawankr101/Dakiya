import { DType } from '../../schema';
import { DeviceChatPrefsSchema, GenderSchema, LabelsAndCirclesSchema, PlatformSchema, UserSettingsAccountSchema, UserSettingsBackupSchema, UserSettingsPrivacySchema } from '../shared';

export const ProfileInfoSchema = DType.Object({
    id: DType.Uuid(),

    username: DType.String(),
    mobile: DType.String(),
    email: DType.String({ format: 'email' }),

    name: DType.Optional(DType.String()),
    dob: DType.Optional(DType.String({ format: 'date' })),
    gender: DType.Optional(GenderSchema),
    country: DType.Optional(DType.String()),
    isVerified: DType.Boolean({ default: false }),

    dp: DType.Optional(DType.String( { format: 'uri' })),
    bio: DType.Optional(DType.String()),

    createdAt: DType.Epoch(),
    updatedAt: DType.Epoch(),
    hlc: DType.Hlc()
}, { $id: 'ProfileInfoSchema' });

export const ClientUserSettingsNotificationsSchema = DType.Object({
    enabled: DType.Boolean({ default: true }),
    vibration: DType.Boolean({ default: true }),
    sound: DType.Boolean({ default: true }),
    groupNotifications: DType.Boolean({ default: true }),
    popupNotifications: DType.Boolean({ default: true }),
    emailNotifications: DType.Boolean({ default: true })
}, { $id: 'ClientUserSettingsNotificationsSchema' });

export const ProfileSettingsSchema = DType.Object({
    id: DType.Uuid(),

    language: DType.String({ default: 'en' }),
    timezone: DType.String({ default: 'UTC' }),

    pinnedConversationId: DType.Optional(DType.Uuid()),
    labels: LabelsAndCirclesSchema,
    circles: LabelsAndCirclesSchema,
    chats: DeviceChatPrefsSchema,
    notifications: ClientUserSettingsNotificationsSchema,
    privacy: UserSettingsPrivacySchema,
    backup: UserSettingsBackupSchema,
    account: UserSettingsAccountSchema,

    createdAt: DType.Epoch(),
    updatedAt: DType.Epoch(),
    hlc: DType.Hlc()
}, { $id: 'ProfileSettingsSchema' });

export const ProfileDevicesSchema = DType.Array(DType.Object({
    id: DType.Uuid(),

    clientId: DType.String(),
    deviceName: DType.String(),
    platform: PlatformSchema,
    osName: DType.String(),
    appVersion: DType.String(),
    lastActiveAt: DType.Epoch(),

    createdAt: DType.Epoch(),
    updatedAt: DType.Epoch(),
    hlc: DType.Hlc()
}), { $id: 'ProfileDevicesSchema' });

export const ProfileRelationshipsSchema = DType.Array(DType.Object({
    id: DType.Uuid(),

    userId: DType.Uuid(),
    isContact: DType.Boolean({ default: false }),
    isFavorite: DType.Boolean({ default: false }),
    isBlocked: DType.Boolean({ default: false }),
    circleIds: DType.Array(DType.Uuid(), { maxItems: 4, default: [] }),

    createdAt: DType.Epoch(),
    updatedAt: DType.Epoch(),
    hlc: DType.Hlc()
}), { $id: 'ProfileRelationshipsSchema' });

export const ProfileSchema = DType.Object({
    info: DType.JsonB(ProfileInfoSchema),
    settings: DType.JsonB(ProfileSettingsSchema),
    devices: DType.JsonB(ProfileDevicesSchema),
    relationships: DType.JsonB(ProfileRelationshipsSchema),
}, { $id: 'ProfileSchema' });

export const ClientUserSchema = DType.DbTable(DType.Object({
    username: DType.String(),
    mobile: DType.String(),
    email: DType.Optional(DType.String({ format: 'email' })),

    name: DType.Optional(DType.String()),
    dob: DType.Optional(DType.String({ format: 'date' })),
    gender: DType.Optional(GenderSchema),
    country: DType.Optional(DType.String()),
    isVerified: DType.Boolean({ default: false }),

    dp: DType.Optional(DType.String( { format: 'uri' })),
    bio: DType.Optional(DType.String())
}), { $id: 'ClientUserSchema' });
