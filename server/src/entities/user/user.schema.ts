import { Type } from 'typebox';
import { DBTableSchema, EpochTimestampSchema, UUIDSchema } from '../../schema';

const UserGenderSchema = Type.Union([
    Type.Literal('male'),
    Type.Literal('female'),
    Type.Literal('other')
]);

export const UserSchema = DBTableSchema({
    username: Type.String(),
    mobile: Type.String(),
    email: Type.Optional(Type.String({ format: 'email' })),

    password: Type.Optional(Type.String()),

    name: Type.Optional(Type.String()),
    dob: Type.Optional(Type.String({ format: 'date' })),
    gender: Type.Optional(UserGenderSchema),
    country: Type.Optional(Type.String()),
    isVerified: Type.Boolean({ default: false }),

    dp: Type.Optional(Type.String( { format: 'uri' })),
    bio: Type.Optional(Type.String()),

    isDeleted: Type.Boolean({ default: false }),
    deletedAt: Type.Optional(EpochTimestampSchema)
}, { $id: 'UserSchema' });

const LebelsAndCirclesSchema = Type.Array(Type.Object({
    id: UUIDSchema,
    name: Type.Optional(Type.String()),
    position: Type.Number()
}), { maxItems: 8, default: [] });

const PrivacyLevelSchema = Type.Union([
    Type.Literal('everyone'),
    Type.Literal('contacts'),
    Type.Literal('nobody')
], { default: 'everyone' });

const BackupFrequencySchema = Type.Union([
    Type.Literal('daily'),
    Type.Literal('weekly'),
    Type.Literal('monthly')
], { default: 'monthly' });

const AccountStatusSchema = Type.Union([
    Type.Literal('active'),
    Type.Literal('deactivated'),
    Type.Literal('deleted')
], { default: 'active' });

export const UserSettingsSchema = DBTableSchema({
    userId: UUIDSchema,

    language: Type.String({ default: 'en' }),
    timezone: Type.String({ default: 'UTC' }),

    pinnedConversationId: Type.Optional(UUIDSchema),
    labels: LebelsAndCirclesSchema,
    circles: LebelsAndCirclesSchema,
    notifications: Type.Object({
        email: Type.Boolean({ default: false }),
    }),
    privacy: Type.Object({
        readReceipts: Type.Boolean({ default: true }),
        lastSeen: PrivacyLevelSchema,
        email: PrivacyLevelSchema,
        dp: PrivacyLevelSchema,
        dob: PrivacyLevelSchema,
        bio: PrivacyLevelSchema
    }),
    backup: Type.Object({
        enabled: Type.Boolean({ default: false }),
        provider: Type.Optional(Type.String()),
        backupLocation: Type.Optional(Type.String()),
        backupFrequency: Type.Optional(BackupFrequencySchema),
        overWifiOnly: Type.Boolean({ default: true }),
        lastBackupAt: Type.Optional(EpochTimestampSchema)
    }),
    account: Type.Object({
        accountStatus: AccountStatusSchema,
        twoFactorAuth: Type.Boolean({ default: false }),
        mfa: Type.Object({
            sms: Type.Optional(Type.String()),
            email: Type.Optional(Type.String()),
            totp: Type.Optional(Type.String())
        }),
        recoveryCodesHash: Type.Optional(Type.Array(Type.String())),
        lastPasswordChange: Type.Optional(EpochTimestampSchema)
    }),
    lastActiveAt: Type.Optional(EpochTimestampSchema)
}, { $id: 'UserSettingsSchema' });

const PlatformSchema = Type.Union([
    Type.Literal('iOS'),
    Type.Literal('Android'),
    Type.Literal('Web'),
    Type.Literal('Desktop')
]);

const ThemeSchema = Type.Union([
    Type.Literal('light'),
    Type.Literal('dark'),
    Type.Literal('system')
], { default: 'system' });

const FontSizeSchema = Type.Union([
    Type.Literal('small'),
    Type.Literal('medium'),
    Type.Literal('large')
], { default: 'medium' });

export const DeviceSchema = DBTableSchema({
    userId: UUIDSchema,
    clientId: Type.String(),
    deviceName: Type.Optional(Type.String()),
    platform: PlatformSchema,
    osName: Type.Optional(Type.String()),
    appVersion: Type.Optional(Type.String()),
    userAgent: Type.Optional(Type.String()),
    ipAddress: Type.Optional(Type.String()),
    fcmToken: Type.Optional(Type.String()),
    isActive: Type.Boolean({ default: true }),
    lastActiveAt: Type.Optional(EpochTimestampSchema),
    chatPrefs: Type.Object({
        theme: ThemeSchema,
        fontSize: FontSizeSchema,
        mediaAutoDownload: Type.Object({
            photos: Type.Boolean({ default: true }),
            videos: Type.Boolean({ default: true }),
            audio: Type.Boolean({ default: true }),
            documents: Type.Boolean({ default: true })
        })
    }),
    notificationPrefs: Type.Object({
        enabled: Type.Boolean({ default: true }),
        groupNotifications: Type.Boolean({ default: true }),
        vibration: Type.Boolean({ default: true }),
        sound: Type.Boolean({ default: true })
    })
}, { $id: 'DeviceSchema' });

export const UserRelationshipSchema = DBTableSchema({
    ownerId: UUIDSchema,
    userId: UUIDSchema,
    isContact: Type.Boolean({ default: false }),
    isFavorite: Type.Boolean({ default: false }),
    isBlocked: Type.Boolean({ default: false }),
    circleIds: Type.Array(UUIDSchema, { maxItems: 4, default: [] })
}, { $id: 'UserRelationshipSchema' });
