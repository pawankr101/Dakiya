import { Exception } from '../../../../exceptions/index.js';
import { PG } from '../connection.js';
import type { Device, User } from '../models/index.js';

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

            if (!user) throw new Exception("User not found", { code: 404 });
            return user;
        } catch (err) {
            if (err instanceof Exception) throw err;
            throw new Exception(err, { code: 500 });
        }
    },

    /**
     * Handles User Registration with default settings in a Transaction.
     */
    async registerUser(userData: User) {
        return userData; // Placeholder for actual implementation
    },

    /**
     * Upserts a device for a user.
     * High-performance approach using ON CONFLICT to reduce roundtrips.
     */
    async syncDevice(userId: string, deviceData: Device) {
        try {
            return await PG.sql`
                INSERT INTO devices (user_id, device_name, platform, fcm_token, last_active_at)
                VALUES (${userId}, ${deviceData.deviceName}, ${deviceData.platform}, ${deviceData.fcmToken}, NOW())
                ON CONFLICT (uid) DO UPDATE SET
                    fcm_token = EXCLUDED.fcm_token,
                    last_active_at = NOW(),
                    app_version = ${deviceData.appVersion}
                RETURNING *
            `;
        } catch (err) {
            throw new Exception(err, { code: 500 });
        }
    }
};
