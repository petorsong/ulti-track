// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// TODO: remove
import { db } from '@/database/drizzle';
import { type PlayerType } from '@/database/schema';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';

export default async function handler(req: Req, res: Res<PlayerType[]>) {
  const result = await db.query.players.findMany({
    with: {
      team: true,
    },
  });
  res.status(200).json(result);
}
