import { Collection, Db, MongoClient } from "mongodb";
import { MONGO_DB } from "../../../config.js";
import { Exception } from "../../../exceptions/index.js";

export class MongoConnection {

    static #client: MongoClient;
    static #db: Db;
    static #connected: boolean = false;

    static {
        this.#client = new MongoClient(MONGO_DB.connectionUrl, {
            auth: {
                username: MONGO_DB.username,
                password: MONGO_DB.password
            }
        });

        // Attempt to connect to the database immediately
        this.#init()
    }

    /**
     * Initializes the MongoDB connection if it is not already connected.
     *
     * This method attempts to connect the MongoDB client and set up the database instance.
     * If the connection is successful, it updates the internal state to reflect the connection status.
     */
    static async #init() {
        try {
            if(!this.#connected) {
                await this.#client.connect();
                this.#db = this.#client.db(MONGO_DB.dbName);
                this.#connected = true;
                console.log("MongoDB connection initialized successfully.");
            }
        } catch(error) {
            console.error("Failed to initialize MongoDB connection.", error);
        }
    }

    /**
     * Retrieves a MongoDB collection with the specified name and type.
     *
     * @template T - The type of documents stored in the collection.
     * @param collectionName - The name of the collection to retrieve.
     * @returns The MongoDB collection instance for the specified type.
     * @throws {Exception} If the database connection is not established.
     */
    public static getCollection<T>(collectionName: string): Collection<T> {
        if (!this.#connected) {
            this.#init();
            throw new Exception("Database connection is not established.", { code: 503 });
        }
        return this.#db.collection<T>(collectionName);
    }
}
