import { eq } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { points } from '@/database/schema';
import { parseJsonBody } from '@/lib/parseJsonBody';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ ok: boolean } | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pointId = req.query.pointId as string;
  const playerIds = parseJsonBody<string[]>(req.body);

  const existing = await db.query.points.findFirst({
    where: (pointsTable, { eq: eqFn }) => eqFn(pointsTable.id, pointId),
  });
  if (!existing) {
    return res.status(404).json({ error: 'Point not found' });
  }

  await db.update(points).set({ playerIds }).where(eq(points.id, pointId));
  res.status(200).json({ ok: true });
}
