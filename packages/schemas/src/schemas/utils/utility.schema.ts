import { Type } from 'typebox';

export const EpochTimestampSchema = Type.Number({
    minimum: 0,
    description: 'Epoch timestamp in milliseconds',
    examples: [1620034828000, 1739168283000, 1783137704453]
});

export const UUIDSchema = Type.String({
    format: 'uuid',
    description: 'UUID v7 string',
    examples: ['01a015bd-eef4-706a-bb7d-6320b45fb90f', '01a015be-3aa6-738c-8b83-f252b80a223a'],
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
});

export const GenderSchema = Type.Union([
    Type.Literal('male'),
    Type.Literal('female'),
    Type.Literal('other')
]);

export const PrivacyLevelSchema = Type.Union([
    Type.Literal('everyone'),
    Type.Literal('contacts'),
    Type.Literal('nobody')
], { default: 'everyone' });

export const BackupFrequencySchema = Type.Union([
    Type.Literal('daily'),
    Type.Literal('weekly'),
    Type.Literal('monthly')
], { default: 'monthly' });

export const AccountStatusSchema = Type.Union([
    Type.Literal('active'),
    Type.Literal('deactivated'),
    Type.Literal('deleted')
], { default: 'active' });

export const PlatformSchema = Type.Union([
    Type.Literal('iOS'),
    Type.Literal('Android'),
    Type.Literal('Web'),
    Type.Literal('Desktop')
]);

export const ThemeSchema = Type.Union([
    Type.Literal('light'),
    Type.Literal('dark'),
    Type.Literal('system')
], { default: 'system' });

export const FontSizeSchema = Type.Union([
    Type.Literal('small'),
    Type.Literal('medium'),
    Type.Literal('large')
], { default: 'medium' });


export const ConversationMemberRoleSchema = Type.Union([
    Type.Literal('member'),
    Type.Literal('admin'),
    Type.Literal('owner')
], { default: 'member' });
