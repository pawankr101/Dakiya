import { default as postgres, type Sql } from 'postgres';
import { DB } from '../../../config.js';

export interface PG {
    /**
     * Returns the SQL connection instance.
     */
    get sql(): Sql;

    /**
     * Initializes the PostgreSQL connection and sets up the necessary tables if they do not already exist.
     * This method should be called before accessing the `sql` property to ensure that the connection is established and ready for use.
     */
    init(): Promise<void>;

    /**
     * Closes the PostgreSQL connection.
     * This method should be called when the connection is no longer needed to release resources.
     */
    close(): Promise<void>;
}

const initTables = async (connection: Sql) => {
    await createRequiredEnums(connection);
    await createUserTable(connection);
    await createUserSettingsTable(connection);
    await createDevicesTable(connection);
    await createConversationsTable(connection);
    await createConversationMembersTable(connection);
    await createMessagesTable(connection);
    await createMessageReactionsTable(connection);
    await createMessageEditsTable(connection);
    await createMediaTable(connection);
    await createDeliveryQueueTable(connection);
    await createIndexes(connection);
}

const createRequiredEnums = async (connection: Sql) => {
    await connection`
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
                CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_enum') THEN
                CREATE TYPE platform_enum AS ENUM ('iOS', 'Android', 'Web', 'Desktop');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
                CREATE TYPE message_type_enum AS ENUM ('text', 'media', 'location', 'poll', 'event');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status_enum') THEN
                CREATE TYPE message_status_enum AS ENUM ('sent', 'delivered', 'read');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_parent_enum') THEN
                CREATE TYPE media_parent_enum AS ENUM ('message', 'user', 'conversation');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN
                CREATE TYPE media_type_enum AS ENUM ('photo', 'video', 'audio', 'document');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_item_enum') THEN
                CREATE TYPE delivery_item_enum AS ENUM ('message', 'reaction', 'edit', 'read_receipt');
            END IF;
        END $$;
    `;
}
const createUserTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE IF NOT EXISTS users (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            mobile VARCHAR(20) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            dp TEXT,
            bio TEXT,
            dob TIMESTAMP,
            gender gender_enum,
            country CHAR(2), -- ISO Country Code
            is_verified BOOLEAN DEFAULT FALSE,
            last_active_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createUserSettingsTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE IF NOT EXISTS user_settings (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            language VARCHAR(10) DEFAULT 'en',
            timezone TEXT DEFAULT 'UTC',
            chats JSONB DEFAULT '{
                "theme": "system",
                "font_size": "medium",
                "media_auto_download": {
                    "photos": true,
                    "videos": false,
                    "audio": true,
                    "documents": false
                }
            }',
            notifications JSONB DEFAULT '{
                "enabled": true,
                "group_notifications": true,
                "vibration": true,
                "sound": true,
                "popup_notifications": true,
                "email_notifications": false
            }',
            privacy JSONB DEFAULT '{
                "blocked_contacts": [],
                "read_receipts": true,
                "last_seen": "everyone",
                "dp": "everyone",
                "about": "everyone"
            }',
            backup JSONB DEFAULT '{
                "enabled": false,
                "backup_location": null,
                "backup_frequency": "daily",
                "backup_over_wifi_only": true,
                "last_backup_at": null
            }',
            account JSONB DEFAULT '{
                "two_factor_auth": false,
                "account_status": "active"
            }',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createDevicesTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE IF NOT EXISTS devices (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            device_name TEXT,
            platform platform_enum NOT NULL,
            os_name TEXT,
            os_version TEXT,
            app_version TEXT,
            user_agent TEXT,
            fcm_token TEXT,
            last_active_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createConversationsTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE conversations (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            is_group BOOLEAN DEFAULT FALSE,
            group_name TEXT,
            group_dp TEXT,
            description TEXT,
            created_by UUID REFERENCES users(uid),
            settings JSONB DEFAULT '{
                "allow_invites": true,
                "admin_only_messages": false,
                "admin_only_edit_info": false
            }',
            last_message_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createConversationMembersTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE conversation_members (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            conversation_id UUID NOT NULL REFERENCES conversations(uid) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            mute_until TIMESTAMP WITH TIME ZONE DEFAULT TO_TIMESTAMP(0),
            is_archived BOOLEAN DEFAULT FALSE,
            is_pinned BOOLEAN DEFAULT FALSE,
            last_read_at TIMESTAMP WITH TIME ZONE,
            is_deleted BOOLEAN DEFAULT FALSE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            added_by UUID REFERENCES users(uid),
            is_admin BOOLEAN DEFAULT FALSE,
            has_left BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(conversation_id, user_id)
        );
    `;
}
const createMessagesTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE messages (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            conversation_id UUID NOT NULL REFERENCES conversations(uid) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(uid),
            type message_type_enum NOT NULL,
            content JSONB NOT NULL, -- Flexible structure for text, poll, location, etc.
            status message_status_enum DEFAULT 'sent',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            delivered_at TIMESTAMP WITH TIME ZONE,
            read_at TIMESTAMP WITH TIME ZONE,
            reply_to_message_id UUID REFERENCES messages(uid),
            is_forwarded BOOLEAN DEFAULT FALSE,
            is_encrypted BOOLEAN DEFAULT FALSE,
            encryption_algorithm TEXT,
            is_edited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createMessageReactionsTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE message_reactions (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            message_id UUID NOT NULL REFERENCES messages(uid) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(uid),
            reaction TEXT NOT NULL, -- Emoji string
            is_removed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createMessageEditsTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE message_edits (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            message_id UUID NOT NULL REFERENCES messages(uid) ON DELETE CASCADE,
            editor_id UUID NOT NULL REFERENCES users(uid),
            previous_type message_type_enum,
            previous_content JSONB,
            new_type message_type_enum,
            new_content JSONB,
            edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createMediaTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE media (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            parent_type media_parent_enum NOT NULL,
            parent_id UUID NOT NULL, -- Can point to user, message, or conversation
            type media_type_enum NOT NULL,
            file_name TEXT,
            remote_path TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER,
            width INTEGER,
            height INTEGER,
            duration INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createDeliveryQueueTable = async (connection: Sql) => {
    await connection`
        CREATE TABLE delivery_queue (
            uid UUID PRIMARY KEY DEFAULT uuidv7(),
            recipient_device_id UUID NOT NULL REFERENCES devices(uid) ON DELETE CASCADE,
            delivery_item_type delivery_item_enum NOT NULL,
            delivery_item_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
}
const createIndexes = async (connection: Sql) => {
    await connection`
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_delivery_device ON delivery_queue(recipient_device_id);
        CREATE INDEX IF NOT EXISTS idx_media_lookup ON media(parent_id, parent_type); -- Polymorphic Lookup
    `;
}

export const PG = (() => {
    let connection: postgres.Sql = null, isConnected = false;
    const PG: PG = Object.create(null);

    const createConnection = async () => {
        const { host, port, database, user, password, maxPoolSize: max, idleTimeoutMillis: idle_timeout, connectionTimeoutMillis: connect_timeout } = DB;
        connection = postgres({ host, port, database, user, password, max, idle_timeout, connect_timeout });
        isConnected = true;
        await initTables(connection);
    };

    Object.defineProperty<PG>(PG, 'sql', {
        get() {
            if (!isConnected) throw new Error('PostgreSQL connection is not initialized. Call PG.init() before accessing the sql property.');
            return connection;
        }
    });

    PG.init = () => {
        if (!isConnected) return createConnection();
        Promise.resolve();
    };

    PG.close = async () => {
        if (isConnected || connection) {
            await connection.end();
            connection = null;
            isConnected = false;
            console.log('DB connection closed successfully.');
        }
    };

    return PG;
})();
