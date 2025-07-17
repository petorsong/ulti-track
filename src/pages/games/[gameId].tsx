import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { db } from '@/database/drizzle';
import { games, players } from '@/database/schema'
import { Stack } from '@mui/material';
import type { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from 'next'
import { useState } from 'react';

type PlayerType = typeof players.$inferSelect;

export const getStaticPaths = (async () => {
  // const res = await fetch(`http://localhost:3000/api/games`);
  // const gamesData: typeof games.$inferSelect[] = await res.json();
  const gamesData = await db.query.games.findMany();
  return {
    paths: gamesData.map((game) => ({ params: { gameId: game.id}})),
    fallback: true, // false or "blocking"
  }
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const res = await fetch(`http://localhost:3000/api/games/${params!.gameId}`);
  const gameData: typeof games.$inferSelect = await res.json();
  const playerData = await db.query.players.findMany(); // TODO: only active players from game
  // const gameData = await db.query.games.findFirst({
  //   where: (games, { eq }) => eq(games.id, `${params!.gameId}`),
  // })
  return { props: { gameData, playerData } }
}) satisfies GetStaticProps<{
  gameData: typeof games.$inferSelect;
  playerData: PlayerType[];
}>

export default function GamePage({
  gameData, playerData,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { teamScore, vsTeamScore, startOnO, startFRatio, startLeft } = gameData!;
  const totalPoints = teamScore! + vsTeamScore!;
  const ratioStrs = startFRatio! ? ['Female', 'Open'] : ['Open', 'Female'];
  const ratio = totalPoints == 0 ? (startFRatio! ? 'Female' : 'Open') : ratioStrs[(((totalPoints+1) % 4) < 2) ? 0 : 1];
  const genderRatio = `${ratio} ${totalPoints % 2 === 0 ? '2' : '1'}`;

  // TODO: deal with halftime for oOrD & fieldSide
  const startOnOStrs = startOnO! ? ['Offence', 'Defence'] : ['Defence', 'Offence'];
  const oOrD = startOnOStrs[totalPoints % 2];
  const sideStr = startLeft! ? ['Left', 'Right'] : ['Right', 'Left'];
  const fieldSide = sideStr[totalPoints % 2];

  const [selectedPlayersL, setSelectedPlayersL] = useState([] as string[]);
  const [selectedPlayersR, setSelectedPlayersR] = useState([] as string[]);
  const { playersL, playersR } = playerData
  .sort((a, b) => (a.isPR === b.isPR)? 0 : b.isPR ? -1 : 1)
  .sort((a, b) => (a.isHandler === b.isHandler)? 0 : b.isHandler ? 1 : -1)
  .reduce((result, player) => {
    if (player.isFemaleMatching) {
      result.playersL.push(player);
    } else {
      result.playersR.push(player);
    }
    return result;
  }, { playersL: [] as PlayerType[], playersR: [] as PlayerType[]});

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={colStackStyles}
    >
      <PointCard {...{
        teamScore: teamScore!,
        vsTeamScore: vsTeamScore!,
        genderRatio,
        oOrD,
        fieldSide,
      }} />
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <Stack
          direction="column"
          spacing={1}
          sx={colStackStyles}
        >
          {playersL.map(player => {
            const playerSelected = selectedPlayersL.includes(player.id);
            return (
              <PlayerButton
                key={player.id}
                variant={playerSelected ? 'solid' : 'outlined'}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  setSelectedPlayersL(playerSelected
                    ? selectedPlayersL.filter((p) => p != player.id)
                    : selectedPlayersL.concat(player.id));
                }}
                {...player}
              />
            );
          })}
        </Stack>
        <Stack
          direction="column"
          spacing={1}
          sx={colStackStyles}
        >
          {playersR.map(player => {
            const playerSelected = selectedPlayersR.includes(player.id);
            return (
              <PlayerButton
                key={player.id}
                variant={playerSelected ? 'solid' : 'outlined'}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  setSelectedPlayersR(playerSelected
                    ? selectedPlayersR.filter((p) => p != player.id)
                    : selectedPlayersR.concat(player.id));
                }}
                {...player}
              />
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}

const colStackStyles = {
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
};
