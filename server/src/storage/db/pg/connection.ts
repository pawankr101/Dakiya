import { Exception } from '@dakiya/utils';
import postgres, { type Sql } from 'postgres';
import { DB } from '../../../config';
import { createDbIfNotExists, initTables } from './queries/db.query';

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
            console.log(`\u001b[34m  [S] PostgreSQL connection established and tables initialized successfully.`);
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
