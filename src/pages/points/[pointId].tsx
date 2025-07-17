// import { useState } from 'react';
import type { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from 'next'
// import { useRouter } from 'next/router';
import { db } from '@/database/drizzle';
import { PlayerType, points } from '@/database/schema'
import { Stack, Typography } from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, splitPlayersByGenderMatch } from '@/utils';

export const getStaticPaths = (async () => {
  const pointsData = await db.query.points.findMany();
  return {
    paths: pointsData.map((point) => ({ params: { pointId: point.id}})),
    fallback: 'blocking',
  }
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const pointData = await db.query.points.findFirst({
    where: (points, { eq }) => eq(points.id, `${params!.pointId}`),
    with: {
      game: true,
    }
  });
  const playersData = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, pointData!.playerIds), 
  });
  return { props: { pointData: pointData!, playersData } }
}) satisfies GetStaticProps<{
  pointData: typeof points.$inferSelect;
  playersData: PlayerType[];
}>

export default function GamePage({
  pointData, playersData,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  // const router = useRouter();
  const gameData = pointData!.game!;
  const { vsTeamName, teamScore, vsTeamScore } = gameData;
  const { genderRatio, oOrD, fieldSide } = calculatePointInfo(gameData);
  const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
  // const [selectedPlayer, setSelectedPlayer] = useState({});

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{...colStackStyles, mt: 1}}
    >
      <PointCard {...{
        vsTeamName: vsTeamName!,
        teamScore: teamScore!,
        vsTeamScore: vsTeamScore!,
        genderRatio,
        oOrD,
        fieldSide,
      }} />
      <Typography level="title-sm" sx={{ mb: 2 }}>
        Let em make plays:
      </Typography>
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
            return (
              <PlayerButton
                key={player.id}
                variant='outlined'
                // disabled={selectedPlayersL.length >= playerLimitL && !playerSelected}
                onClick={() => {}}
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
            return (
              <PlayerButton
                key={player.id}
                variant='outlined'
                // disabled={selectedPlayersR.length >= playerLimitR && !playerSelected}
                onClick={() => {}}
                {...player}
              />
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  )
};