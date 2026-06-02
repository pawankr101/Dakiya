import type { User } from "../../../entities/models.js";
import { Jwt } from "../../../services/index.js";

export const registerUser = async (_user: User): Promise<string> => {
    // Implement registration logic here
    // For example, call UsersQuery.createUser(user);
    return 'user_id';
}

export const loginUser = async (uidEmailOrPhone: string, _password: string): Promise<string> => {
    // validate login credential.
    // to be done

    // Generate a JWT token for the user
    return Jwt.generateToken({ uid: uidEmailOrPhone });
};

export const logoutUser = async (_userId: string): Promise<boolean> => {
    // Implement logout logic here
    // For example, invalidate the user's session or token
    return true; // Return true if logout was successful
};
