import { DType } from '../../schema';
import { DeviceChatPrefsSchema, GenderSchema, LabelsAndCirclesSchema, PlatformSchema, UserSettingsAccountSchema, UserSettingsBackupSchema, UserSettingsPrivacySchema } from '../shared';

export const UserSchema = DType.DbTable(DType.Object({
    username: DType.String(),
    mobile: DType.String(),
    email: DType.Optional(DType.String({ format: 'email' })),

    password: DType.Optional(DType.String()),

    name: DType.Optional(DType.String()),
    dob: DType.Optional(DType.String({ format: 'date' })),
    gender: DType.Optional(GenderSchema),
    country: DType.Optional(DType.String()),
    isVerified: DType.Boolean({ default: false }),

    dp: DType.Optional(DType.String( { format: 'uri' })),
    bio: DType.Optional(DType.String()),

    isDeleted: DType.Boolean({ default: false }),
    deletedAt: DType.Optional(DType.Epoch())
}), { $id: 'UserSchema' });

export const UserSettingsNotificationsSchema = DType.Object({
    email: DType.Boolean({ default: false })
}, { $id: 'UserSettingsNotificationsSchema' });

export const UserSettingsSchema = DType.DbTable(DType.Object({
    userId: DType.Uuid(),

    language: DType.String({ default: 'en' }),
    timezone: DType.String({ default: 'UTC' }),

    pinnedConversationId: DType.Optional(DType.Uuid()),
    labels: DType.JsonB(LabelsAndCirclesSchema, { default: '[]' }),
    circles: DType.JsonB(LabelsAndCirclesSchema, { default: '[]' }),
    notifications: DType.JsonB(UserSettingsNotificationsSchema),
    privacy: DType.JsonB(UserSettingsPrivacySchema),
    backup: DType.JsonB(UserSettingsBackupSchema),
    account: DType.JsonB(UserSettingsAccountSchema),
    lastActiveAt: DType.Optional(DType.Epoch())
}), { $id: 'UserSettingsSchema' });

export const DeviceNotificationPrefsSchema = DType.Object({
    enabled: DType.Boolean({ default: true }),
    groupNotifications: DType.Boolean({ default: true }),
    vibration: DType.Boolean({ default: true }),
    sound: DType.Boolean({ default: true })
}, { $id: 'DeviceNotificationPrefsSchema' });

export const DeviceSchema = DType.DbTable(DType.Object({
    userId: DType.Uuid(),
    clientId: DType.String(),
    deviceName: DType.Optional(DType.String()),
    platform: PlatformSchema,
    osName: DType.Optional(DType.String()),
    appVersion: DType.Optional(DType.String()),
    userAgent: DType.Optional(DType.String()),
    ipAddress: DType.Optional(DType.String()),
    fcmToken: DType.Optional(DType.String()),
    isActive: DType.Boolean({ default: true }),
    lastActiveAt: DType.Optional(DType.Epoch()),
    chatPrefs: DType.JsonB(DeviceChatPrefsSchema),
    notificationPrefs: DType.JsonB(DeviceNotificationPrefsSchema)
}), { $id: 'DeviceSchema' });

export const UserRelationshipSchema = DType.DbTable(DType.Object({
    ownerId: DType.Uuid(),
    userId: DType.Uuid(),
    isContact: DType.Boolean({ default: false }),
    isFavorite: DType.Boolean({ default: false }),
    isBlocked: DType.Boolean({ default: false }),
    circleIds: DType.Array(DType.Uuid(), { maxItems: 4, default: [] })
}), { $id: 'UserRelationshipSchema' });
