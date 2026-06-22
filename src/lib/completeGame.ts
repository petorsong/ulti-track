import { inArray } from 'drizzle-orm';
import type { InsertPointEvent, TimeoutsJson } from '@/database/schema';
import { games, players, pointEvents, points } from '@/database/schema';
import { db } from '@/database/drizzle';
import { normalizeScoreAssists } from '@/lib/normalizeScoreAssists';
import type { CompleteGamePayload } from '@/lib/draftGame/syncPayload';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function collectPlayerIdsFromPayload(payload: CompleteGamePayload): string[] {
  const ids = new Set<string>(payload.activePlayerIds);
  for (const point of payload.points) {
    point.playerIds.forEach((id) => ids.add(id));
    for (const event of point.events) {
      if (event.playerOneId) {
        ids.add(event.playerOneId);
      }
      if (event.playerTwoId) {
        ids.add(event.playerTwoId);
      }
    }
  }
  return Array.from(ids);
}

export function findMissingPlayerIds(referencedIds: string[], existingIds: string[]): string[] {
  const existing = new Set(existingIds);
  return referencedIds.filter((id) => !existing.has(id));
}

export async function validateCompleteGamePlayers(
  tx: DbExecutor,
  payload: CompleteGamePayload
): Promise<{ ok: true } | { ok: false; missingPlayerIds: string[] }> {
  const referenced = collectPlayerIdsFromPayload(payload);
  if (referenced.length === 0) {
    return { ok: true };
  }
  const rows = await tx.select({ id: players.id }).from(players).where(inArray(players.id, referenced));
  const missingPlayerIds = findMissingPlayerIds(
    referenced,
    rows.map((r) => r.id)
  );
  if (missingPlayerIds.length > 0) {
    return { ok: false, missingPlayerIds };
  }
  return { ok: true };
}

export async function insertCompleteGame(
  tx: DbExecutor,
  teamId: string,
  payload: CompleteGamePayload
): Promise<string> {
  const { game: gameData } = payload;
  const [insertedGame] = await tx
    .insert(games)
    .values({
      teamId,
      vsTeamName: gameData.vsTeamName,
      startOnO: gameData.startOnO,
      startFRatio: gameData.startFRatio,
      enforceAbba: gameData.enforceAbba,
      startLeft: gameData.startLeft,
      teamScore: gameData.teamScore,
      vsTeamScore: gameData.vsTeamScore,
      isComplete: gameData.isComplete,
      activePlayerIds: payload.activePlayerIds,
      halftimeAt: gameData.halftimeAt,
      wasLastScoreUs: gameData.wasLastScoreUs,
      timeouts: gameData.timeouts as TimeoutsJson,
      startTime: gameData.startTime,
      clientDraftId: payload.draftId,
    })
    .returning({ gameId: games.id });

  const gameId = insertedGame.gameId;

  for (const point of payload.points) {
    const [insertedPoint] = await tx
      .insert(points)
      .values({ gameId, playerIds: point.playerIds, isActive: false })
      .returning({ pointId: points.id });

    const eventsWithPointId: InsertPointEvent[] = point.events.map((event) => ({
      ...event,
      pointId: insertedPoint.pointId,
    }));
    const normalizedEvents = normalizeScoreAssists(eventsWithPointId);
    if (normalizedEvents.length > 0) {
      await tx.insert(pointEvents).values(normalizedEvents);
    }
  }

  return gameId;
}
