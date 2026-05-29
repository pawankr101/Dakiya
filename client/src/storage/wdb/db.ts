import { Database, type DatabaseAdapter } from '@nozbe/watermelondb';
import LokiAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId'
import { v7 as uuid } from 'uuid';
import { Conversation, ConversationMember, Media, Message, MessageEdit, MessageReaction, User } from './models';
import { DAKIYA_LOCALDB_SCHEMA } from './schema';

setGenerator(uuid)

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
