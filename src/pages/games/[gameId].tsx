import { games } from '@/database/schema'
import type { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from 'next'
 
export const getStaticPaths = (async () => {
  const res = await fetch(`http://localhost:3000/api/games`);
  const gamesData: typeof games.$inferSelect[] = await res.json();
  return {
    paths: gamesData.map((game) => ({ params: { gameId: game.id}})),
    fallback: true, // false or "blocking"
  }
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({params}) => {
  const res = await fetch(`http://localhost:3000/api/games/${params!.gameId}`);
  const gameData = await res.json();
  return { props: { gameData } }
}) satisfies GetStaticProps<{
  gameData: typeof games.$inferSelect
}>
 
export default function GamePage({
  gameData,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (<h1>wtf</h1>);
}