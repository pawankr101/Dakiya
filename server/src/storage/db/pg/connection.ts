import { Exception } from '@dakiya/shared';
import postgres, { type Sql } from 'postgres';
import { DB } from '../../../config';

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
     * Checks the health of the PostgreSQL connection by executing a simple query.
     * @returns A promise that resolves to true if the connection is healthy, or false if there is an issue with the connection.
     */
    ping(): Promise<boolean>;

    /**
     * Closes the PostgreSQL connection.
     * This method should be called when the connection is no longer needed to release resources.
     */
    close(): Promise<void>;
}

const createDbIfNotExists = async () => {
    const { host, port, user, password, database } = DB;
    const tempConnection = postgres({ host, port, user, password, database: 'postgres', max: 1 });
    try {
        const [dbExists] = await tempConnection`SELECT 1 FROM pg_database WHERE datname = ${database}`;
        if (!dbExists) {
            await tempConnection`CREATE DATABASE ${tempConnection(database)}`;
            console.log(`Database "${database}" created successfully.`);
        }
    } catch (error) {
        await tempConnection.end();
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    } finally {
        await tempConnection.end();
    }
}

const initTables = async (connection: Sql) => {
    await createRequiredEnums(connection);

    await Promise.all([
        createUserTable(connection),
        createUserSettingsTable(connection),
        createDevicesTable(connection),
        createUserRelationshipsTable(connection),

        createConversationsTable(connection),
        createConversationMembersTable(connection),

        createMessagesTable(connection),
        createMessageExclusionsTable(connection),
        createMessageReactionsTable(connection)
    ]);

    await createIndexes(connection);
    await createTriggers(connection);
}
const createRequiredEnums = async (connection: Sql) => {
    try {
        await connection`
            DO $$ BEGIN
                -- 1. User Enums
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
                    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_level_enum') THEN
                    CREATE TYPE privacy_level_enum AS ENUM ('everyone', 'contacts', 'nobody');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_frequency_enum') THEN
                    CREATE TYPE backup_frequency_enum AS ENUM ('daily', 'weekly', 'monthly');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
                    CREATE TYPE account_status_enum AS ENUM ('active', 'deactivated', 'deleted');
                END IF;

                -- 2. Device Enums
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_enum') THEN
                    CREATE TYPE platform_enum AS ENUM ('iOS', 'Android', 'Web', 'Desktop');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_enum') THEN
                    CREATE TYPE theme_enum AS ENUM ('light', 'dark', 'system');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'font_size_enum') THEN
                    CREATE TYPE font_size_enum AS ENUM ('small', 'medium', 'large');
                END IF;

                -- 3. Conversation Enums
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type_enum') THEN
                    CREATE TYPE conversation_type_enum AS ENUM ('direct', 'group', 'channel', 'system', 'self');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_member_role_enum') THEN
                    CREATE TYPE conversation_member_role_enum AS ENUM ('member', 'admin', 'owner');
                END IF;

                -- 4. Message Enums
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
                    CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'video', 'audio', 'document', 'contact', 'location', 'poll', 'event', 'system', 'delete');
                END IF;
            END $$;
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}

const createUserTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Public Identifiers
                username VARCHAR(50) UNIQUE NOT NULL,
                mobile VARCHAR(20) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,

                -- Authentication
                password TEXT,

                -- Profile Information (KYC Fields)
                name TEXT,
                dob DATE,
                gender gender_enum,
                country CHAR(2),
                is_verified BOOLEAN DEFAULT FALSE,

                -- Non-KYC Profile Information
                dp TEXT,
                bio TEXT,

                -- Tombstoning
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMPTZ,

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createUserSettingsTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS user_settings (
                id UUID PRIMARY KEY DEFAULT uuidv7(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

                -- Localization
                language VARCHAR(10) DEFAULT 'en',
                timezone TEXT DEFAULT 'UTC',

                -- Grouping
                pinned_conversation_id UUID,
                labels JSONB DEFAULT '[]',
                circles JSONB DEFAULT '[]',

                -- Settings (Note: camelCase JSON keys to match TypeBox schema)
                notifications JSONB DEFAULT '{
                    "email": false
                }',
                privacy JSONB DEFAULT '{
                    "readReceipts": true,
                    "lastSeen": "everyone",
                    "email": "everyone",
                    "dp": "everyone",
                    "dob": "everyone",
                    "bio": "everyone"
                }',
                backup JSONB DEFAULT '{
                    "enabled": false,
                    "provider": null,
                    "backupLocation": null,
                    "backupFrequency": "monthly",
                    "overWifiOnly": true,
                    "lastBackupAt": null
                }',
                account JSONB DEFAULT '{
                    "accountStatus": "active",
                    "twoFactorAuth": false,
                    "mfa": { "sms": null, "email": null, "totp": null },
                    "recoveryCodesHash": [],
                    "lastPasswordChange": null
                }',

                -- Audit & Sync
                last_active_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createDevicesTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS devices (
                id UUID PRIMARY KEY DEFAULT uuidv7(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

                -- Device Identifiers
                client_id TEXT UNIQUE NOT NULL,
                device_name TEXT,
                platform platform_enum NOT NULL,
                os_name TEXT,
                app_version TEXT,
                user_agent TEXT,
                ip_address TEXT,
                fcm_token TEXT,
                is_active BOOLEAN DEFAULT TRUE,

                -- Device-Specific Preferences (camelCase JSON keys to match TypeBox schema)
                chat_prefs JSONB NOT NULL DEFAULT '{
                    "theme": "system",
                    "fontSize": "medium",
                    "mediaAutoDownload": {
                        "photos": true,
                        "videos": true,
                        "audio": true,
                        "documents": true
                    }
                }',
                notification_prefs JSONB NOT NULL DEFAULT '{
                    "enabled": true,
                    "groupNotifications": true,
                    "vibration": true,
                    "sound": true
                }',

                -- Audit & Sync
                last_active_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createUserRelationshipsTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS user_relationships (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Relationship metadata
                owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

                -- Relationship status
                is_contact BOOLEAN DEFAULT FALSE,
                is_favorite BOOLEAN DEFAULT FALSE,
                is_blocked BOOLEAN DEFAULT FALSE,

                -- Contact grouping
                circle_ids UUID[] DEFAULT '{}'::uuid[],

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL,

                -- Enforce one relationship record per owner-user pair
                UNIQUE(owner_id, user_id)
                -- Enforces maxItems: 4 constraint
                CHECK (cardinality(circle_ids) <= 4)
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}

const createConversationsTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Conversation Type & Metadata
                type conversation_type_enum NOT NULL,
                metadata JSONB,

                -- Conversation level message pinning
                pinned_message_root_id UUID,

                -- Tombstoning (For dropping/archiving whole groups)
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMPTZ,

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL

                -- Enforce metadata presence based on conversation type
                CHECK (
                    (type IN ('group', 'channel', 'system') AND metadata IS NOT NULL) OR
                    (type IN ('direct', 'self'))
                )
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createConversationMembersTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS conversation_members (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Relational Links
                conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

                -- Member Role & Preferences
                role conversation_member_role_enum DEFAULT 'member',
                chat_prefs JSONB DEFAULT '{}',
                mute_until TIMESTAMPTZ,
                pinned_message_root_id UUID,
                label_ids UUID[] DEFAULT '{}'::uuid[],

                -- Member Status
                is_active BOOLEAN DEFAULT TRUE,
                joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMPTZ,
                cleared_at TIMESTAMPTZ,
                last_read_message_id UUID,
                last_read_at TIMESTAMPTZ,

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL,

                -- Enforce one membership record per conversation-user pair
                UNIQUE(conversation_id, user_id),
                -- Enforces maxItems: 4 constraint
                CHECK (cardinality(label_ids) <= 4)
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}

const createMessagesTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Threading & Versioning
                root_id UUID NOT NULL,
                version INTEGER NOT NULL DEFAULT 0,

                -- Relational Links
                conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id UUID REFERENCES users(id),
                reply_to_message_id UUID REFERENCES messages(id),

                -- Payload
                type message_type_enum NOT NULL,
                content JSONB NOT NULL,

                -- Grouping Engine
                message_group_id UUID,
                message_group_position INTEGER,

                -- Metadata
                is_forwarded BOOLEAN DEFAULT FALSE,

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL,

                -- Prevent duplicate versions in a single message thread
                UNIQUE(root_id, version),

                -- CONSTRAINT 1: sender_id MUST exist unless it is a system message
                CHECK (sender_id IS NOT NULL OR type = 'system'),

                -- CONSTRAINT 2: Grouping fields must either both be null, or both have values
                CHECK ((message_group_id IS NULL) = (message_group_position IS NULL))

                -- CONSTRAINT 3: Prevent Sync Bombs (Limit JSONB payload to 128KB)
                CHECK (pg_column_size(content) <= 131072)
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createMessageExclusionsTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS message_exclusions (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                -- Tie exclusion to the thread root so edits don't bypass the exclusion
                message_root_id UUID NOT NULL,

                -- Who is the message hidden from?
                deleted_for UUID NOT NULL REFERENCES users(id),

                -- Who performed the action? (Can be the same user, or an admin)
                deleted_by UUID NOT NULL REFERENCES users(id),

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL,

                -- CONSTRAINT: A specific message thread can only be excluded once per target user
                UNIQUE(message_root_id, deleted_for)
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createMessageReactionsTable = async (connection: Sql) => {
    try {
        await connection`
            CREATE TABLE IF NOT EXISTS message_reactions (
                id UUID PRIMARY KEY DEFAULT uuidv7(),

                message_root_id UUID NOT NULL REFERENCES messages(root_id),
                message_id UUID NOT NULL REFERENCES messages(id),
                user_id UUID NOT NULL REFERENCES users(id),

                reaction TEXT NOT NULL,

                -- Tombstoning for when a user removes their reaction
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMPTZ,

                -- Audit & Sync
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                hlc TEXT NOT NULL,

                -- CONSTRAINT 1: Enforce one reaction record per user per message (supports upserting)
                UNIQUE(message_id, user_id),

                -- CONSTRAINT 2: Prevent malicious payload bloat (e.g., sending a 5MB string as an emoji)
                CHECK (char_length(reaction) > 0 AND char_length(reaction) <= 20)
            );
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}

const createIndexes = async (connection: Sql) => {
    try {
        // ==========================================
        // 1. WATERMELONDB SYNC INDEXES
        // Critical for: `SELECT * FROM table WHERE updated_at > last_pulled_at`
        // ==========================================
        await connection`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_conversation_members_updated_at ON conversation_members(updated_at);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_messages_updated_at ON messages(updated_at);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_message_exclusions_updated_at ON message_exclusions(updated_at);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_message_reactions_updated_at ON message_reactions(updated_at);`;

        // ==========================================
        // 2. COMPOSED SYNC INDEXES (High Performance)
        // Critical for scoped syncs: `WHERE conversation_id IN (...) AND updated_at > ?`
        // ==========================================
        await connection`CREATE INDEX IF NOT EXISTS idx_messages_conv_updated ON messages(conversation_id, updated_at DESC);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_updated ON conversation_members(conversation_id, updated_at DESC);`;

        // ==========================================
        // 3. THREADING & TRIGGER OPTIMIZATION
        // Critical for: The exclusion validation trigger we wrote earlier uses
        // `WHERE root_id = NEW.message_root_id LIMIT 1`
        // ==========================================
        await connection`CREATE INDEX IF NOT EXISTS idx_messages_root_id ON messages(root_id);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_message_reactions_root_id ON message_reactions(message_root_id);`;

        // ==========================================
        // 4. FOREIGN KEY INDEXES
        // Prevents full table scans during CASCADE deletes and JOINs
        // ==========================================
        await connection`CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);`;
        await connection`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);`;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_INDEX_ERROR' });
    }
};
const createTriggers = async (connection: Sql) => {
    await createImmutableTombstoneTrigger(connection);
    await createOwnershipTransferTrigger(connection);
    await createMessageChainTombstoneTrigger(connection);
    await createMessageDeletedForTrigger(connection);
}

/***************** Triggers: Start *****************/

const createImmutableTombstoneTrigger = async (connection: Sql) => {
    try {
        // Step 1: Define the PL/pgSQL function
        await connection`
            CREATE OR REPLACE FUNCTION prevent_undelete_user()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
                    RAISE EXCEPTION 'Immutable Tombstone Violation: Once a user is marked as deleted, it cannot be reversed.';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        // Step 2: Attach the trigger to the users table
        await connection`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_user_undelete') THEN
                    CREATE TRIGGER trg_prevent_user_undelete
                    BEFORE UPDATE ON users
                    FOR EACH ROW
                    EXECUTE FUNCTION prevent_undelete_user();
                END IF;
            END $$;
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createOwnershipTransferTrigger = async (connection: Sql) => {
    try {
        // Step 1: Define the PL/pgSQL function
        await connection`
            CREATE OR REPLACE FUNCTION handle_owner_departure()
            RETURNS TRIGGER AS $$
            DECLARE
                v_conv_type conversation_type_enum;
                v_new_owner_id UUID;
            BEGIN
                -- Trigger condition: An active owner is leaving or being deactivated
                IF OLD.role = 'owner' AND OLD.is_active = TRUE AND NEW.is_active = FALSE THEN

                    -- Fetch the conversation type (group or channel)
                    SELECT type INTO v_conv_type FROM conversations WHERE id = NEW.conversation_id;

                    -- Rule 1: Look for the longest-serving admin
                    SELECT user_id INTO v_new_owner_id
                    FROM conversation_members
                    WHERE conversation_id = NEW.conversation_id
                        AND is_active = TRUE
                        AND user_id != NEW.user_id
                        AND role = 'admin'
                    ORDER BY joined_at ASC
                    LIMIT 1;

                    -- If an admin is found, promote them and exit
                    IF v_new_owner_id IS NOT NULL THEN
                        UPDATE conversation_members SET role = 'owner', updated_at = CURRENT_TIMESTAMP WHERE conversation_id = NEW.conversation_id AND user_id = v_new_owner_id;
                        RETURN NEW;
                    END IF;

                    -- Rule 2: Fallback behavior based on conversation type
                    IF v_conv_type = 'group' THEN
                        -- Rule 2a: Look for the longest-serving regular member
                        SELECT user_id INTO v_new_owner_id
                        FROM conversation_members
                        WHERE conversation_id = NEW.conversation_id
                            AND is_active = TRUE
                            AND user_id != NEW.user_id
                            AND role = 'member'
                        ORDER BY joined_at ASC
                        LIMIT 1;

                        IF v_new_owner_id IS NOT NULL THEN
                            -- Promote member to owner
                            UPDATE conversation_members SET role = 'owner', updated_at = CURRENT_TIMESTAMP WHERE conversation_id = NEW.conversation_id AND user_id = v_new_owner_id;
                        ELSE
                            -- Rule 2b: Group is completely empty, soft-delete the conversation
                            UPDATE conversations SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = NEW.conversation_id;
                        END IF;

                    ELSIF v_conv_type = 'channel' THEN
                        -- Rule 3: Channels do not promote regular members. Soft-delete the channel.
                        UPDATE conversations SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = NEW.conversation_id;
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        // Step 2: Attach the trigger to the conversation_members table
        await connection`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_owner_departure') THEN
                    CREATE TRIGGER trg_handle_owner_departure
                    AFTER UPDATE OF is_active ON conversation_members
                    FOR EACH ROW
                    EXECUTE FUNCTION handle_owner_departure();
                END IF;
            END $$;
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createMessageChainTombstoneTrigger = async (connection: Sql) => {
    try {
        // Step 1: Define the PL/pgSQL function
        await connection`
            CREATE OR REPLACE FUNCTION prevent_message_after_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Check if a 'delete' message already exists for this thread (root_id)
                IF EXISTS (
                    SELECT 1 FROM messages
                    WHERE root_id = NEW.root_id AND type = 'delete'
                ) THEN
                    RAISE EXCEPTION 'Immutable Message Chain Violation: A delete tombstone already exists for root_id %.', NEW.root_id;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        // Step 2: Attach the trigger to the messages table
        await connection`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_message_after_delete') THEN
                    CREATE TRIGGER trg_prevent_message_after_delete
                    BEFORE INSERT ON messages
                    FOR EACH ROW
                    EXECUTE FUNCTION prevent_message_after_delete();
                END IF;
            END $$;
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}
const createMessageDeletedForTrigger = async (connection: Sql) => {
    try {
        // Step 1: Define the PL/pgSQL function
        await connection`
            CREATE OR REPLACE FUNCTION validate_message_exclusion()
            RETURNS TRIGGER AS $$
            DECLARE
                v_sender_id UUID;
                v_conversation_id UUID;
                v_actor_role TEXT;
                v_target_role TEXT;
                v_actor_level INT;
                v_target_level INT;
            BEGIN
                -- FAST PATH: Self-deletion ("Delete for me")
                IF NEW.deleted_for = NEW.deleted_by THEN
                    RETURN NEW;
                END IF;

                -- MODERATION PATH: Someone is hiding a message from another user

                -- 1. Fetch conversation_id and sender_id
                SELECT sender_id, conversation_id INTO v_sender_id, v_conversation_id
                FROM messages
                WHERE root_id = NEW.message_root_id
                LIMIT 1;

                -- 2. Prevent force-hiding a message from the person who sent it
                IF NEW.deleted_for = v_sender_id THEN
                    RAISE EXCEPTION 'Exclusion Violation: Cannot administratively hide a message from its original sender.';
                END IF;

                -- 3. Fetch roles for both the Actor (deleted_by) and Target (deleted_for)
                SELECT role INTO v_actor_role FROM conversation_members
                WHERE conversation_id = v_conversation_id AND user_id = NEW.deleted_by AND is_active = TRUE;

                SELECT role INTO v_target_role FROM conversation_members
                WHERE conversation_id = v_conversation_id AND user_id = NEW.deleted_for AND is_active = TRUE;

                -- 4. Assign numeric levels for hierarchy comparison (Owner=3, Admin=2, Member=1, None=0)
                v_actor_level := CASE v_actor_role WHEN 'owner' THEN 3 WHEN 'admin' THEN 2 WHEN 'member' THEN 1 ELSE 0 END;
                v_target_level := CASE v_target_role WHEN 'owner' THEN 3 WHEN 'admin' THEN 2 WHEN 'member' THEN 1 ELSE 0 END;

                -- 5. Validate the Actor is at least an Admin
                IF v_actor_level < 2 THEN
                    RAISE EXCEPTION 'Exclusion Violation: Regular members cannot administratively hide messages for others.';
                END IF;

                -- 6. Enforce strict role hierarchy (Actor must outrank Target)
                IF v_actor_level <= v_target_level THEN
                    RAISE EXCEPTION 'Exclusion Violation: Actor role (%) cannot override target role (%).', COALESCE(v_actor_role, 'none'), COALESCE(v_target_role, 'none');
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        // Step 2: Attach the trigger to the message_exclusions table
        await connection`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_message_exclusion') THEN
                    CREATE TRIGGER trg_validate_message_exclusion
                    BEFORE INSERT OR UPDATE ON message_exclusions
                    FOR EACH ROW
                    EXECUTE FUNCTION validate_message_exclusion();
                END IF;
            END $$;
        `;
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
    }
}

/***************** Triggers: End *****************/

export const PG = (() => {
    let connection = null as unknown as Sql, isConnected = false;
    const PG: PG = Object.create(null);

    Object.defineProperty<PG>(PG, 'sql', {
        get() {
            if (!isConnected) throw new Exception('PostgreSQL connection is not initialized. Call PG.init() before accessing the sql property.', { code: 'DAKIYA_PG_ERROR' });
            return connection;
        }
    });

    PG.init = async () => {
        try {
            if (isConnected) return;
            await createDbIfNotExists();
            const { host, port, database, user, password, maxPoolSize: max, idleTimeoutMillis: idle_timeout, connectionTimeoutMillis: connect_timeout } = DB;
            connection = postgres({
                host, port, database, user, password, max, idle_timeout, connect_timeout,
                transform: postgres.camel,
                onnotice: () => { }, // Disable notice messages from PostgreSQL
                types: {
                    timestamptz: {
                        to: 1184,
                        from: [1184],
                        // INBOUND (Node -> Postgres): Passing ISO string as it is.
                        serialize: (value: number) => value,
                        // OUTBOUND (Postgres -> Node): Convert ISO string to Node.js Date timestamp
                        parse: (raw: string) => Date.parse(raw)
                    }
                }
            });
            isConnected = true;
            await initTables(connection);
            console.log('PostgreSQL connection established and tables initialized successfully.');
        } catch (error) {
            throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
        }
    };

    PG.ping = async () => {
        if (!isConnected) return false;
        try {
            await connection`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    };

    PG.close = async () => {
        if (isConnected || connection) {
            await connection.end();
            connection = null as unknown as Sql;
            isConnected = false;
            console.log('DB connection closed successfully.');
        }
    };

    return PG;
})();
