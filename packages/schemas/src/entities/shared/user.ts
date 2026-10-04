import { DType } from '../../schema';
import { AccountStatusSchema, BackupFrequencySchema, FontSizeSchema, PrivacyLevelSchema, ThemeSchema } from './options';

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
