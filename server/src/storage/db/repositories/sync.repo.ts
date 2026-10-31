import type { DatabaseTables } from '../../../types';
import { pullSyncQuery, pushSyncQuery } from '../pg';

export const pullSyncData = (userId: string, lastHlc?: string) => {
    return pullSyncQuery(userId, lastHlc);
};

export const pushSyncData = async (userId: string, changes: DatabaseTables) => {
    return pushSyncQuery(userId, changes);
};
