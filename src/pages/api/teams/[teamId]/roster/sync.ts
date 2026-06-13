import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { parseJsonBody } from '@/lib/parseJsonBody';
import { applyRosterSync, type RosterSyncPayload } from '@/lib/syncRoster';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ ok: boolean } | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const teamId = req.query.teamId as string;
  const payload = parseJsonBody<RosterSyncPayload>(req.body);

  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    columns: { id: true },
  });
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  await db.transaction(async (tx) => applyRosterSync(tx, teamId, payload));
  res.status(200).json({ ok: true });
}
