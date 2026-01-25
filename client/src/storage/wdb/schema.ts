import { type AppSchema, type TableSchema, appSchema, tableSchema } from "@nozbe/watermelondb/Schema";

const USER_TABLE_SCHEMA: TableSchema = tableSchema({
    name: 'users',
    columns: [
        { name: 'uid', type: 'string', isIndexed: true },

        //-- Public Identifiers
        { name: 'username', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'mobile', type: 'string', isIndexed: true },

        //-- Profile Information
        { name: 'name', type: 'string' },
        { name: 'bio', type: 'string', isOptional: true },
        { name: 'dob', type: 'number', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'country', type: 'string', isOptional: true },

        //-- Security & Status
        { name: 'is_verified', type: 'boolean' },
        { name: 'last_active_at', type: 'number' },

        //-- User Settings
        { name: 'settings', type: 'string' },

        { name: 'pinned_conversation_id', type: 'string', isOptional: true },

        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' }
    ]
});

const CONVERSATION_TABLE_SCHEMA: TableSchema = tableSchema({
    name: '',
    columns:[
        { name: 'uid', type: 'string', isIndexed: true },

        { name: 'is_group', type: 'boolean' },

        { name: 'group_name', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string', isOptional: true },
        { name: 'settings', type: 'string', isOptional: true },

        { name: 'last_message_at', type: 'number', isOptional: true },

        { name: 'mute_until', type: 'number', isOptional: true },
        { name: 'is_archived', type: 'boolean', isOptional: true },
        { name: 'mute_until', type: 'boolean', isOptional: true },
    ]
})

const CONVERSATION_MEMBER_TABLE_SCHEMA: TableSchema = tableSchema({
    name: '',
    columns:[
        { name: 'uid', type: 'string', isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },

        { name: 'is_admin', type: 'boolean' },
        { name: 'joined_at', type: 'number' },
        { name: 'has_left', type: 'boolean' }
    ]
})

const MESSAGE_TABLE_SCHEMA: TableSchema = tableSchema({
    name: '',
    columns:[
        { name: 'uid', type: 'string', isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string', isIndexed: true },

        //-- Message Content
        { name: 'type', type: 'string' },
        { name: 'content', type: 'string' }, // JSON String

        //-- Message Metadata
        { name: 'status', type: 'string' }, // 'pending', 'sent', 'delivered', 'read', 'failed'
        { name: 'sent_at', type: 'number', isOptional: true },
        { name: 'delivered_at', type: 'number', isOptional: true },
        { name: 'read_at', type: 'number', isOptional: true },

        //-- Reply & Forwarding
        { name: 'reply_to_message_id', type: 'string', isOptional: true },
        { name: 'is_forwarded', type: 'boolean', isOptional: true },
    ]
})

const MESSAGE_REACTION_TABLE_SCHEMA: TableSchema = tableSchema({
    name: '',
    columns:[
        { name: 'uid', type: 'string', isIndexed: true },
        { name: 'message_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'reaction', type: 'string' },
        { name: 'is_removed', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' }
    ]
})

const MESSAGE_EDIT_TABLE_SCHEMA: TableSchema = tableSchema({
    name: '',
    columns: [
        { name: 'uid', type: 'string', isIndexed: true },
        { name: 'message_id', type: 'string', isIndexed: true },
        { name: 'editor_id', type: 'string' },
        { name: 'previous_content', type: 'string' }, // JSON String
        { name: 'new_content', type: 'string' },      // JSON String
        { name: 'edited_at', type: 'number' },
        { name: 'created_at', type: 'number' }
    ]
})

const MEDIA_TABLE_SCHEMA: TableSchema = tableSchema({
    name: 'media',
    columns: [
        { name: 'uid', type: 'string', isIndexed: true },

        //-- Parent Reference
        { name: 'parent_type', type: 'string' }, // 'message', 'user', 'conversation'
        { name: 'parent_id', type: 'string' },

        //-- Media File Info
        { name: 'type', type: 'string' }, // 'photo', 'video', 'audio', 'document'
        { name: 'file_name', type: 'string', isOptional: true },
        { name: 'local_path', type: 'string', isOptional: true },
        { name: 'thumbnail_path', type: 'string', isOptional: true },
        { name: 'remote_path', type: 'string', isOptional: true },

        //-- Media Metadata
        { name: 'mime_type', type: 'string', isOptional: true },
        { name: 'file_size', type: 'number', isOptional: true },
        { name: 'width', type: 'number', isOptional: true },
        { name: 'height', type: 'number', isOptional: true },
        { name: 'duration', type: 'number', isOptional: true },

        //-- Upload/Download Status
        { name: 'status', type: 'string' }, // 'pending', 'uploaded', 'downloaded', 'failed'
    ]
});

export const DAKIYA_LOCALDB_SCHEMA: AppSchema = appSchema({
    version: 1,
    tables: [
        USER_TABLE_SCHEMA,
        CONVERSATION_TABLE_SCHEMA,
        CONVERSATION_MEMBER_TABLE_SCHEMA,
        MESSAGE_TABLE_SCHEMA,
        MESSAGE_REACTION_TABLE_SCHEMA,
        MESSAGE_EDIT_TABLE_SCHEMA,
        MEDIA_TABLE_SCHEMA
    ]
});
