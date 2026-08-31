import { DB } from '../../../../config';
import type { DatabaseTables, DatabaseTablesChanges } from '../../../../types';
import { PG } from '../connection';


export const pullSyncQuery = async (userId: string, lastPulledAtIso?: string): Promise<{ timestamp: number, rawData: Partial<DatabaseTables> }> => {
    return PG.sql.begin('ISOLATION LEVEL REPEATABLE READ', async (tx) => {

        // 1. Fetch Atomic Time Snapshot
        const [{serverTimeMs, boundaryIso}] = await tx<{ serverTimeMs: string; boundaryIso: string }[]>`
            WITH snap AS (SELECT NOW() AS ts)
            SELECT
                (EXTRACT(EPOCH FROM ts) * 1000)::bigint AS server_time_ms,
                to_char((ts - (INTERVAL '1 day' * ${DB.syncBoundryInDays})) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS boundary_iso
            FROM snap
        `;

        const rawData: Partial<DatabaseTables> = {
            users: [],
            user_relationships: [],
            conversations: [],
            conversation_members: [],
            messages: [],
            message_reactions: [],
            message_exclusions: []
        }

        if (!lastPulledAtIso) {
            // --- INITIAL SYNC ---


            return { timestamp: Number(serverTimeMs), rawData };
        }
        // --- DELTA SYNC ---


        return { timestamp: Number(serverTimeMs), rawData };
    });
};

export const pushSyncQuery = async (userId: string, changes: Partial<DatabaseTablesChanges>): Promise<void> => {
    await PG.sql.begin(async (tx) => {

    });
};
