import { Utility } from "../../../../app/services/index.js";
import { MONGO_DB } from "../../../../config.js";
import { Exception } from "../../../../exceptions/index.js";
import { User } from "../../../../Models/index.js";
import { MongoConnection } from "../connection.js";


export class UsersQuery {
    static #usersCollection = MongoConnection.db.collection<User>(MONGO_DB.collections.users);

    public static async createUser(user: User): Promise<User> {
        if (!user) throw new Exception("User object is required.", { code: 400 });
        if (user.uid) {
            const existingUser = await this.findUserByUidEmailOrPhone(user.uid);
            if (existingUser) throw new Exception("User already exists.", { code: 409 });
        }
        if (!user.uid) user.uid = Utility.generateUid();
        if (!user.email) throw new Exception("Email is required.", { code: 400 });
        if (!user.phone) throw new Exception("Phone is required.", { code: 400 });
        if (!user.firstName) throw new Exception("First name is required.", { code: 400 });

        user.name = `${user.firstName} ${user.lastName || ''}`.trim();
        user.profilePic = user.profilePic || '';
        user.createdAt = new Date();
        user.updatedAt = new Date();
        user.password = 'password';

        await this.#usersCollection.insertOne(user);
        return user;
    }

    public static async findUserByUidEmailOrPhone(uidEmailOrPhone: string, fields: string[] = []): Promise<User | null> {
        if (!uidEmailOrPhone) throw new Exception("UserId, Email or Phone is required.", { code: 400 });

        // building projection object
        const projection: {[K: string]: 0|1}  = {};
        if (Utility.isNotEmptyArray(fields)) Utility.forLoop(fields, (field) => { projection[field] = 1; });

        return await this.#usersCollection.findOne({
            $or: [
                { uid: uidEmailOrPhone },
                { email: uidEmailOrPhone },
                { phone: uidEmailOrPhone }
            ]
        }, { projection: {_id: 0, ...projection}});
    }

    public static async validateUserCredentials(uidEmailOrPhone: string, password: string, fields: string[] = []): Promise<User> {
        if (!uidEmailOrPhone) throw new Exception("UserId, Email or Phone is required.", { code: 400 });
        if (!password) throw new Exception("Password is required.", { code: 400 });

        const user = await this.findUserByUidEmailOrPhone(uidEmailOrPhone, [...fields, 'password']);
        if (!user) throw new Exception("UserId, Email or Phone is incorrect.", { code: 404 });
        if (user.password !== password) throw new Exception("Password is incorrect.", { code: 401 });
        delete user.password;
        return user;
    }
}
