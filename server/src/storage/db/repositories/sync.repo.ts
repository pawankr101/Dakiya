import type { DatabaseTablesChanges } from '../../../types';
import { pullSyncQuery, pushSyncQuery } from '../pg';

export const pullSyncData = (userId: string, lastHlc?: string) => {
    return pullSyncQuery(userId, lastHlc);
};

export const pushSyncData = async (userId: string, changes: DatabaseTablesChanges) => {
    return pushSyncQuery(userId, changes);
};
