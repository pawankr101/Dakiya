import { Model } from "@nozbe/watermelondb";
import { text, field, json, date, relation, immutableRelation } from "@nozbe/watermelondb/decorators";
import { identity } from "@nozbe/watermelondb/utils/fp";

interface TextMessageContent {
    text: string;
}

interface MediaMessageContent {
    media_caption?: string;
}

interface LocationMessageContent {
    location_name?: string;
    latitude: number;
    longitude: number;
}

interface PollMessageContent {
    question: string;
    options: string[];
    allows_multiple_answers: boolean;
    expires_at?: number;
}

interface EventMessageContent {
    title: string;
    description?: string;
    event_location?: string;
    start_time: number;
    end_time?: number;
}

type NonMediaMessageContent<T = 'text' | 'media' | 'location' | 'poll' | 'event'> = T extends 'text' ? TextMessageContent
    : T extends 'media' ? MediaMessageContent : T extends 'location' ? LocationMessageContent
    : T extends 'poll' ? PollMessageContent : T extends 'event' ? EventMessageContent
    : TextMessageContent | MediaMessageContent | LocationMessageContent | PollMessageContent | EventMessageContent;

export class Message extends Model {
    static table = 'messages';

    @text('uid') uid: string;
    @immutableRelation('conversations', 'uid') conversation_id: string;
    @immutableRelation('users', 'uid') sender_id: string;

    @field('type') type: 'text' | 'media' | 'location' | 'poll' | 'event';
    @json('content', identity) content: NonMediaMessageContent<typeof this.type>;

    @field('status') status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    @field('sent_at') sent_at?: number;
    @field('delivered_at') delivered_at?: number;
    @field('read_at') read_at?: number;

    @immutableRelation('messages', 'uid') reply_to_message_id?: string;
    @field('is_forwarded') is_forwarded?: boolean;
}

export class MessageReaction extends Model {
    static table = 'message_reactions';

    @text('uid') uid: string;
    @immutableRelation('messages', 'uid') message_id: string;
    @immutableRelation('users', 'uid') user_id: string;

    @field('reaction') reaction: string;
    @field('is_removed') is_removed: boolean;

    @date('created_at') created_at: Date;
    @date('updated_at') updated_at: Date;
}

export class MessageEdit extends Model {
    static table = 'message_edits';

    @text('uid') uid: string;
    @relation('messages', 'uid') message_id: string;
    @immutableRelation('users', 'uid') editor_id: string;

    @field('previous_type') previous_type: 'text' | 'media' | 'location' | 'poll' | 'event';
    @json('previous_content', identity) previous_content: NonMediaMessageContent<typeof this.previous_type>;
    @field('new_type') new_type: 'text' | 'media' | 'location' | 'poll' | 'event';
    @json('new_content', identity) new_content: NonMediaMessageContent<typeof this.new_type>;

    @date('edited_at') edited_at: Date;
}
