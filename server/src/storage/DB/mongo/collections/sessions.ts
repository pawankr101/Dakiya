import { Collection } from "mongodb";
import { MONGO_DB } from "../../../../config.js";
import { Exception } from "../../../../exceptions/index.js";
import { User, UserSession } from "../../../../Models/index.js";
import { MongoConnection } from "../connection.js";
import { Helpers } from "../../../../utils/helpers.js";


export class SessionsQuery {

    static #getSessionsCollection: () => Collection<UserSession> = (() => {
        let collection: Collection<UserSession>;
        return () => {
            if(!collection) {
                collection = MongoConnection.getCollection<UserSession>(MONGO_DB.collections.sessions);
            }
            return collection;
        }
    })();

    public static async createSession(userId: string, userAgent: string, ipAddress: string): Promise<UserSession> {
        if (!userId || !userAgent || !ipAddress) throw new Exception("User ID, user agent, and IP address are required to create a new session.", { code: 400 });

        const session = new UserSession();
        session.sessionId = Helpers.getUuid();
        session.userId = userId;
        session.userAgent = userAgent;
        session.ipAddress = ipAddress;
        session.createdAt = new Date();
        session.isActive = true;
        session.lastActiveAt = new Date();
        session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        session.lastSessionId = null;
        session.closedAt = null;

        await this.#getSessionsCollection().insertOne(session);
        return session;
    }
}
