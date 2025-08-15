import { type PlayerIdToTeamGroupId } from '@/types';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { players } from '@/database/schema';
import { inArray } from 'drizzle-orm';

export default async function handler(req: Req, res: Res<{ ok: boolean }>) {
  const playerTeamGroupIds: PlayerIdToTeamGroupId[] = JSON.parse(req.body);
  const playersToUpdate = playerTeamGroupIds.reduce((resultMap, { playerId, teamGroupId }) => {
    if (!resultMap.has(teamGroupId)) {
      resultMap.set(teamGroupId, []);
    }
    resultMap.get(teamGroupId)!.push(playerId);
    return resultMap;
  }, new Map<string, string[]>());

  await db.transaction((tx) =>
    Promise.all(
      Array.from(playersToUpdate.keys()).map((teamGroupId) =>
        tx
          .update(players)
          .set({ teamGroupId })
          .where(inArray(players.id, playersToUpdate.get(teamGroupId)!))
      )
    )
  );
  res.status(200).json({ ok: true });
}
