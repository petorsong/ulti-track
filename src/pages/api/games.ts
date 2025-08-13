import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type GameType } from '@/database/schema';

export default async function handler(req: Req, res: Res<GameType[]>) {
  const result = await db.query.games.findMany();
  res.status(200).json(result);
}
