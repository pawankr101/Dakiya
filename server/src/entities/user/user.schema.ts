import { Type } from 'typebox';

const UserGenderSchema = Type.Union([
    Type.Literal('male'),
    Type.Literal('female'),
    Type.Literal('other')
]);

export const UserSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    username: Type.String(),
    email: Type.String(),
    mobile: Type.String(),
    passwordHash: Type.String(),
    name: Type.Optional(Type.String()),
    dp: Type.Optional(Type.String()),
    bio: Type.Optional(Type.String()),
    dob: Type.Optional(Type.String({ format: 'date' })),
    gender: Type.Optional(UserGenderSchema),
    country: Type.Optional(Type.String()),
    isVerified: Type.Boolean(),
    lastActiveAt: Type.Optional(Type.String({ format: 'date-time' })),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
});

const ThemeSchema = Type.Union([
    Type.Literal('light'),
    Type.Literal('dark'),
    Type.Literal('system')
]);

const FontSizeSchema = Type.Union([
    Type.Literal('small'),
    Type.Literal('medium'),
    Type.Literal('large')
]);

const PrivacyLevelSchema = Type.Union([
    Type.Literal('everyone'),
    Type.Literal('contacts'),
    Type.Literal('nobody')
]);

const BackupFrequencySchema = Type.Union([
    Type.Literal('daily'),
    Type.Literal('weekly'),
    Type.Literal('monthly')
]);

const AccountStatusSchema = Type.Union([
    Type.Literal('active'),
    Type.Literal('deactivated'),
    Type.Literal('deleted')
]);

export const UserSettingsSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
    language: Type.String(),
    timezone: Type.String(),
    chats: Type.Object({
        theme: ThemeSchema,
        fontSize: FontSizeSchema,
        mediaAutoDownload: Type.Object({
            photos: Type.Boolean(),
            videos: Type.Boolean(),
            audio: Type.Boolean(),
            documents: Type.Boolean(),
        }),
    }),
    notifications: Type.Object({
        enabled: Type.Boolean(),
        groupNotifications: Type.Boolean(),
        vibration: Type.Boolean(),
        sound: Type.Boolean(),
        popupNotifications: Type.Boolean(),
        emailNotifications: Type.Boolean(),
    }),
    privacy: Type.Object({
        blockedContacts: Type.Array(Type.String()),
        readReceipts: Type.Boolean(),
        lastSeen: PrivacyLevelSchema,
        dp: PrivacyLevelSchema,
        about: PrivacyLevelSchema,
    }),
    backup: Type.Object({
        enabled: Type.Boolean(),
        backupLocation: Type.Optional(Type.String()),
        backupFrequency: BackupFrequencySchema,
        backupOverWifiOnly:	Type.Boolean(),
        lastBackupAt:	Type.Optional(Type.String({ format: 'date-time' })),
    }),
    account:	Type.Object({
        twoFactorAuth:	Type.Boolean(),
        accountStatus:	AccountStatusSchema,
    })
});

const PlatformSchema = Type.Union([
    Type.Literal('iOS'),
    Type.Literal('Android'),
    Type.Literal('Web'),
    Type.Literal('Desktop')
]);

export const DeviceSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
    deviceName: Type.Optional(Type.String()),
    platform: PlatformSchema,
    osName: Type.Optional(Type.String()),
    osVersion: Type.Optional(Type.String()),
    appVersion: Type.Optional(Type.String()),
    userAgent: Type.Optional(Type.String()),
    fcmToken: Type.Optional(Type.String()),
    lastActiveAt: Type.Optional(Type.String({ format: 'date-time' })),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
});
