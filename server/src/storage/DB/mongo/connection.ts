import { Db, MongoClient } from "mongodb";
import { MONGO_DB } from "../../../config.js";

export class MongoConnection {
    
    public static client: MongoClient;
    public static db: Db;

    static {
        this.client = new MongoClient(MONGO_DB.connectionUrl, {
            auth: {
                username: MONGO_DB.username,
                password: MONGO_DB.password
            }
        });
        this.db = this.client.db(MONGO_DB.dbName);
        
        this.client.connect().then(() => {
            console.log("MongoDB connection established successfully.");
        }).catch((error) => {
            console.error("Error connecting to MongoDB:", error);
        });
    }
}
