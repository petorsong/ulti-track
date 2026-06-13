import { inArray } from 'drizzle-orm';
import { db } from '@/database/drizzle';
import { players } from '@/database/schema';
import type { PlayerIdToTeamGroupId } from '@/types';
import type { PendingNewPlayer, PendingTypeUpdate } from '@/lib/rosterCache';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RosterSyncPayload = {
  groupUpdates?: PlayerIdToTeamGroupId[];
  newPlayers?: PendingNewPlayer[];
  typeUpdates?: PendingTypeUpdate[];
};

async function insertNewPlayers(
  tx: DbExecutor,
  teamId: string,
  newPlayers: PendingNewPlayer[]
): Promise<void> {
  if (newPlayers.length === 0) {
    return;
  }
  await tx.insert(players).values(
    newPlayers.map((p) => ({
      id: p.id,
      teamId,
      firstName: p.firstName,
      lastName: null,
      isFMP: p.isFMP,
      isPR: false,
      type: p.type,
      nickname: null,
      order: null,
      teamGroupId: p.teamGroupId,
    }))
  );
}

async function applyTypeUpdates(tx: DbExecutor, typeUpdates: PendingTypeUpdate[]): Promise<void> {
  if (typeUpdates.length === 0) {
    return;
  }
  await Promise.all(
    typeUpdates.map(({ playerId, type }) => tx.update(players).set({ type }).where(inArray(players.id, [playerId])))
  );
}

async function applyGroupUpdates(tx: DbExecutor, groupUpdates: PlayerIdToTeamGroupId[]): Promise<void> {
  if (groupUpdates.length === 0) {
    return;
  }
  const playersToUpdate = groupUpdates.reduce((resultMap, { playerId, teamGroupId }) => {
    if (!resultMap.has(teamGroupId)) {
      resultMap.set(teamGroupId, []);
    }
    resultMap.get(teamGroupId)!.push(playerId);
    return resultMap;
  }, new Map<string, string[]>());

  await Promise.all(
    Array.from(playersToUpdate.keys()).map((teamGroupId) =>
      tx
        .update(players)
        .set({ teamGroupId })
        .where(inArray(players.id, playersToUpdate.get(teamGroupId)!))
    )
  );
}

export async function applyRosterSync(tx: DbExecutor, teamId: string, payload: RosterSyncPayload): Promise<void> {
  if (payload.newPlayers?.length) {
    await insertNewPlayers(tx, teamId, payload.newPlayers);
  }
  if (payload.typeUpdates?.length) {
    await applyTypeUpdates(tx, payload.typeUpdates);
  }
  if (payload.groupUpdates?.length) {
    await applyGroupUpdates(tx, payload.groupUpdates);
  }
}
