import LokiAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { DAKIYA_LOCALDB_SCHEMA } from './schema';
import { Database, type DatabaseAdapter } from '@nozbe/watermelondb';
import { User, Conversation, ConversationMember, Message, MessageReaction, MessageEdit, Media } from './models/index.js'

export class LocalDB {
    readonly #adapter: DatabaseAdapter = new LokiAdapter({
        dbName: 'dakiya-ldb',
        schema: DAKIYA_LOCALDB_SCHEMA
    });
    readonly #db: Database = new Database({
        adapter: this.#adapter,
        modelClasses: [ User, Conversation, ConversationMember, Message, MessageReaction, MessageEdit, Media ]
    });

    get db(): Database {
        return this.#db;
    }
}
