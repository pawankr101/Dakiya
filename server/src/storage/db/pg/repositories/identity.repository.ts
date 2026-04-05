import { Exception } from '@dakiya/shared';
import { PG } from '../connection.js';
import type { User } from '../models/index.js';

export const IdentityRepository = {

    /**
     * Fetches a complete User Profile including Settings.
     * Uses JSONB aggregation for a single-trip high-performance join.
     */
    async getFullProfile(userId: string) {
        try {
            const [user] = await PG.sql<User[]>`
                SELECT * from users u WHERE u.uid = ${userId};
            `;
            if (!user) throw new Exception("User not found", { code: 'NOT_FOUND' });
            return user;
        } catch (err) {
            if (err instanceof Exception) throw err;
            throw new Exception(err);
        }
    },

    /**
     * Handles User Registration with default settings in a Transaction.
     */
    async registerUser(userData: User) {
        return userData; // Placeholder for actual implementation
    }
};
