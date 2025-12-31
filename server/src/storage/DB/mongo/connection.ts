import { Collection, Db, MongoClient } from "mongodb";
import { MONGO_DB } from "../../../config.js";
import { Exception } from "../../../exceptions/index.js";
import { Helpers } from "../../../utils/index.js";

export class MongoDB {
    static #privateHash = Helpers.getUuid();
    static #instance: MongoDB;

    #client: MongoClient;
    #db: Db;
    #connected: boolean = false;

    constructor(hash: string) {
        if(hash !== MongoDB.#privateHash)
        this.#client = new MongoClient(MONGO_DB.connectionUrl, {
            auth: {
                username: MONGO_DB.username,
                password: MONGO_DB.password
            }
        });
    }

    async connect() {
        try {
            if(!this.#connected) {
                await this.#client.connect();
                this.#db = this.#client.db(MONGO_DB.dbName);
                this.#connected = true;
                console.log("MongoDB connection initialized successfully.");
            }
        } catch(error) {
            new Exception("Failed to initialize MongoDB connection.", { code: 503, cause: error } );
        }
    }

    static getConnection() {
        if(!this.#instance) this.#instance = new MongoDB(this.#privateHash);
        return this.#instance;
    }

    static async getCollection<T>(collectionName: string): Promise<Collection<T>> {
        const mongo = MongoDB.getConnection();
        try {
            if(!mongo.#connected) await mongo.connect();
            return mongo.#db.collection<T>(collectionName);
        } catch (error) {
            throw new Exception("Database connection is not established.", { code: 500, cause: error } );
        }
    }
}
