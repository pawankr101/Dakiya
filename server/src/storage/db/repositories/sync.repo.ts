import type { DatabaseTablesChanges } from '../../../types';
import { pullSyncQuery, pushSyncQuery } from '../pg';

export const pullSyncData = (userId: string, lastPulledAtIso?: string) => {
    return pullSyncQuery(userId, lastPulledAtIso);
};

export const pushSyncData = async (userId: string, changes: DatabaseTablesChanges) => {
    return pushSyncQuery(userId, changes);
};
