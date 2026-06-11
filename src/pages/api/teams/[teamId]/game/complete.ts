import { eq } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games } from '@/database/schema';
import { insertCompleteGame, validateCompleteGamePlayers } from '@/lib/completeGame';
import type { CompleteGamePayload } from '@/lib/draftGame/syncPayload';
import { parseJsonBody } from '@/lib/parseJsonBody';
import type { ApiError } from '@/types';

export default async function handler(
  req: Req,
  res: Res<{ gameId: string } | ApiError | { error: string; missingPlayerIds: string[] }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const teamId = req.query.teamId as string;
  const payload = parseJsonBody<CompleteGamePayload>(req.body);

  if (!payload.draftId) {
    return res.status(400).json({ error: 'draftId required' });
  }

  const existing = await db.query.games.findFirst({
    where: eq(games.clientDraftId, payload.draftId),
    columns: { id: true },
  });
  if (existing) {
    return res.status(200).json({ gameId: existing.id });
  }

  try {
    const gameId = await db.transaction(async (tx) => {
      const validation = await validateCompleteGamePlayers(tx, payload);
      if (!validation.ok) {
        throw { type: 'missing_players' as const, missingPlayerIds: validation.missingPlayerIds };
      }
      return insertCompleteGame(tx, teamId, payload);
    });

    return res.status(200).json({ gameId });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'type' in err &&
      err.type === 'missing_players' &&
      'missingPlayerIds' in err
    ) {
      return res.status(400).json({
        error: 'Unknown player IDs in game data',
        missingPlayerIds: err.missingPlayerIds as string[],
      });
    }
    throw err;
  }
}
