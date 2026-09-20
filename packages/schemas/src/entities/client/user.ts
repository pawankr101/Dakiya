import { DType } from '../../schema';
import { AccountStatusSchema, BackupFrequencySchema, FontSizeSchema, GenderSchema, PlatformSchema, PrivacyLevelSchema, ThemeSchema } from '../shared';

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


export const LabelsAndCirclesSchema = DType.Array(DType.Object({
    id: DType.Uuid(),
    name: DType.Optional(DType.String()),
    position: DType.Number()
}), { maxItems: 8, default: [], $id: 'LabelsAndCirclesSchema' });

export const DeviceChatPrefsSchema = DType.Object({
    theme: ThemeSchema,
    fontSize: FontSizeSchema,
    mediaAutoDownload: DType.Object({
        photos: DType.Boolean({ default: true }),
        videos: DType.Boolean({ default: true }),
        audio: DType.Boolean({ default: true }),
        documents: DType.Boolean({ default: true })
    })
}, { $id: 'DeviceChatPrefsSchema' });

export const UserSettingsNotificationsSchema = DType.Object({
    enabled: DType.Boolean({ default: true }),
    vibration: DType.Boolean({ default: true }),
    sound: DType.Boolean({ default: true }),
    groupNotifications: DType.Boolean({ default: true }),
    popupNotifications: DType.Boolean({ default: true }),
    emailNotifications: DType.Boolean({ default: true })
}, { $id: 'UserSettingsNotificationsSchema' });

export const UserSettingsPrivacySchema = DType.Object({
    readReceipts: DType.Boolean({ default: true }),
    lastSeen: PrivacyLevelSchema,
    email: PrivacyLevelSchema,
    dp: PrivacyLevelSchema,
    dob: PrivacyLevelSchema,
    bio: PrivacyLevelSchema
}, { $id: 'UserSettingsPrivacySchema' });

export const UserSettingsBackupSchema = DType.Object({
    enabled: DType.Boolean({ default: false }),
    provider: DType.Optional(DType.String()),
    backupLocation: DType.Optional(DType.String()),
    backupFrequency: BackupFrequencySchema,
    overWifiOnly: DType.Boolean({ default: true }),
    lastBackupAt: DType.Optional(DType.Epoch())
}, { $id: 'UserSettingsBackupSchema' });

export const UserSettingsAccountSchema = DType.Object({
    accountStatus: AccountStatusSchema,
    twoFactorAuth: DType.Boolean({ default: false }),
    mfa: DType.Object({
        sms: DType.Optional(DType.String()),
        email: DType.Optional(DType.String()),
        totp: DType.Optional(DType.String())
    }),
    recoveryCodesHash: DType.Optional(DType.Array(DType.String())),
    lastPasswordChange: DType.Optional(DType.Epoch())
}, { $id: 'UserSettingsAccountSchema' });

export const ProfileSettingsSchema = DType.Object({
    id: DType.Uuid(),

    language: DType.String({ default: 'en' }),
    timezone: DType.String({ default: 'UTC' }),

    pinnedConversationId: DType.Optional(DType.Uuid()),
    labels: LabelsAndCirclesSchema,
    circles: LabelsAndCirclesSchema,
    chats: DeviceChatPrefsSchema,
    notifications: UserSettingsNotificationsSchema,
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
});

export const UserSchema = DType.DbTable(DType.Object({
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
}), { $id: 'UserSchema' });
