import { Exception } from '@dakiya/shared';
import { type JetStreamClient, jetstream } from '@nats-io/jetstream';
import { connect, type NatsConnection } from '@nats-io/transport-node';
import { CACHE } from "../config.js";

export interface Nats {
    /**
     * Initializes the NATS connection. Must be called before using any other methods.
     * If the connection is already established, it will do nothing.
     */
    init(): Promise<void>;

    /**
     * Pings the NATS server to check if the connection is alive.
     * @returns A promise resolving to true if the connection is alive, or false otherwise.
     */
    ping(): Promise<boolean>;

    /**
     * Gets the JetStream client instance. Throws an error if the connection is not established.
     * @returns The JetStream client instance.
     * @throws {Exception} If the NATS connection is not established.
     */
    get jsc(): JetStreamClient;

    /**
     * Gets the NATS connection instance. Throws an error if the connection is not established.
     * @returns The NATS connection instance.
     * @throws {Exception} If the NATS connection is not established.
     */
    get nc(): NatsConnection;

    /**
     * Checks if the NATS connection is currently established and not closed.
     * @returns True if the connection is established and open, false otherwise.
     */
    isConnected(): boolean;

    /**
     * Closes the NATS connection.
     * @returns A promise resolving when the connection is closed.
     */
    close(): Promise<void>;
}

const createNatsConnection = (): Promise<NatsConnection> => {
    return connect({
        name: 'dakiya-nats',
        servers: `nats://${CACHE.host}:${CACHE.port}`,
        user: CACHE.user,
        pass: CACHE.password,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
        pingInterval: 10000,
        maxPingOut: 3,
        timeout: 5000
    });
};

const createJetStreamClient = (connection: NatsConnection): JetStreamClient => {
    return jetstream(connection, {
        timeout: 5000,
        apiPrefix: 'dakiya-js',
    });
};

const pingNats = async (connection: NatsConnection): Promise<boolean> => {
    if (connection && !connection.isClosed()) {
        let timer: NodeJS.Timeout | undefined;
        try {
            await Promise.race([
                connection.flush(),
                new Promise((_, reject) =>
                    timer = setTimeout(() => reject(new Error('NATS ping timeout')), 2000)
                )
            ]);
            return true;
        } catch {
            return false;
        } finally {
            clearTimeout(timer);
        }
    }
    return false;
};

const closeConnection = async (connection: NatsConnection): Promise<void> => {
    if (!connection.isClosed()) {
        await connection.close();
    }
};

export const Nats = (() => {
    const Nats: Nats = Object.create(null);
    let nc: NatsConnection | undefined;
    let jsc: JetStreamClient | undefined;

    const buildConnection = async () => {
        let tempConnection: NatsConnection | undefined;
        try {
            tempConnection = await createNatsConnection();
            const jsClient = createJetStreamClient(tempConnection);
            await tempConnection.flush();
            nc = tempConnection; jsc = jsClient;
            nc.closed().then((error) => {
                if (error) console.error('[NATS] closed with error', error);
                else console.info('[NATS] connection closed');
            }).finally(() => {
                if (nc === tempConnection) {
                    nc = undefined; jsc = undefined;
                }
            });
        } catch (error) {
            if (tempConnection && !tempConnection.isClosed()) {
                try {
                    await tempConnection.close();
                } catch (err) {
                    throw Exception.from(err as Error, { cause: error as Error, code: 'DAKIYA_NATS_ERROR' });
                }
            }
            throw Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' });
        }
    }

    Nats.init = (() => {
        let initPromise: Promise<void> | undefined;
        return () => {
            if(!initPromise) {
                if (!nc || nc.isClosed()) {
                    initPromise = buildConnection().finally(() => {
                        initPromise = undefined;
                    });
                } else return Promise.resolve();
            }
            return initPromise;
        };
    })();

    Nats.ping = () => {
        if (nc) return pingNats(nc);
        return Promise.resolve(false);
    };

    Object.defineProperty(Nats, 'jsc', {
        get() {
            if (jsc) return jsc;
            throw new Exception('NATS JetStream client not initialized', { code: 'DAKIYA_NATS_ERROR' });
        }
    });

    Object.defineProperty(Nats, 'nc', {
        get() {
            if (nc) return nc;
            throw new Exception('NATS connection is not established', { code: 'DAKIYA_NATS_ERROR' })
        }
    });

    Nats.isConnected = () => {
        return !!nc && !nc.isClosed();
    }

    Nats.close = () => {
        if (nc) return closeConnection(nc);
        return Promise.resolve();
    };

    return Nats;
})();
