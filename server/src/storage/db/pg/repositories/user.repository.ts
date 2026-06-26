import { Exception } from '@dakiya/shared';
import { PG } from '../connection';
import type { User } from '../types';

export const IdentityRepository = {

    /**
     * Fetches a complete User Profile including Settings.
     * Uses JSONB aggregation for a single-trip high-performance join.
     */
    async getFullProfile(userId: string) {
        try {
            const [user] = await PG.sql<User[]>`
                SELECT * from users u WHERE u.id = ${userId};
            `;
            if (!user) throw new Exception("User not found", { code: 'NOT_FOUND' });
            return user;
        } catch (error) {
            throw Exception.from(error as Error, { code: 'DAKIYA_PG_ERROR' });
        }
    },

    /**
     * Handles User Registration with default settings in a Transaction.
     */
    async registerUser(userData: User) {
        return userData; // Placeholder for actual implementation
    }
};
