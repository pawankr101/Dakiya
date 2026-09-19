import { DType } from '../../schema';

export const GenderSchema = DType.Union([
    DType.Literal('male'),
    DType.Literal('female'),
    DType.Literal('other')
]);

export const PrivacyLevelSchema = DType.Union([
    DType.Literal('everyone'),
    DType.Literal('contacts'),
    DType.Literal('nobody')
], { default: 'everyone' });

export const BackupFrequencySchema = DType.Union([
    DType.Literal('daily'),
    DType.Literal('weekly'),
    DType.Literal('monthly')
], { default: 'monthly' });

export const AccountStatusSchema = DType.Union([
    DType.Literal('active'),
    DType.Literal('deactivated'),
    DType.Literal('deleted')
], { default: 'active' });

export const PlatformSchema = DType.Union([
    DType.Literal('iOS'),
    DType.Literal('Android'),
    DType.Literal('Web'),
    DType.Literal('Desktop')
]);

export const ThemeSchema = DType.Union([
    DType.Literal('light'),
    DType.Literal('dark'),
    DType.Literal('system')
], { default: 'system' });

export const FontSizeSchema = DType.Union([
    DType.Literal('small'),
    DType.Literal('medium'),
    DType.Literal('large')
], { default: 'medium' });


export const ConversationMemberRoleSchema = DType.Union([
    DType.Literal('member'),
    DType.Literal('admin'),
    DType.Literal('owner')
], { default: 'member' });
