import { Model } from "@nozbe/watermelondb";
import { text, field, json, date, relation, immutableRelation } from "@nozbe/watermelondb/decorators";
import { identity } from "@nozbe/watermelondb/utils/fp";

export interface ConversationSettings {
    allow_invite: boolean;
    admin_only_messages: boolean;
    admin_only_edit_info: boolean;
}

export class Conversation extends Model {
    static table = 'conversations';

    @text('uid') uid: string;
    @field('is_group') is_group: boolean;

    //-- Group Conversation Details
    @field('group_name') group_name?: string;
    @field('description') description?: string;
    @field('created_by') created_by?: string;

    @json('settings', identity) settings?: ConversationSettings;

    @field('last_message_at') last_message_at?: number;

    @field('mute_until') mute_until?: number;
    @field('is_archived') is_archived?: boolean;
    @field('is_deleted') is_deleted?: boolean;
}

export class ConversationMember extends Model {
    static table = 'conversation_members';

    @text('uid') uid: string;
    @relation('conversations', 'uid') conversation_id: string;
    @immutableRelation('users', 'uid') user_id: string;

    //-- Group Conversation Specific Fields
    @field('is_admin') is_admin: boolean;
    @field('joined_at') joined_at: number;
    @field('has_left') has_left: boolean;

    @date('created_at') created_at: Date;
    @date('updated_at') updated_at: Date;
}
