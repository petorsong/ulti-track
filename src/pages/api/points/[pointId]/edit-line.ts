import { eq } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { points } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ ok: boolean }>) {
  const pointId = req.query.pointId as string;
  const playerIds: string[] = JSON.parse(req.body);

  await db.update(points).set({ playerIds }).where(eq(points.id, pointId));
  res.status(200).json({ ok: true });
}
