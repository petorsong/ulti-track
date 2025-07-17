import { useState } from 'react';
import type { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from 'next'
import { useRouter } from 'next/router';
import { db } from '@/database/drizzle';
import { games, PlayerType } from '@/database/schema'
import { Button, Stack, Typography } from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, splitPlayersByGenderMatch } from '@/utils';

export const getStaticPaths = (async () => {
  const gamesData = await db.query.games.findMany();
  return {
    paths: gamesData.map((game) => ({ params: { gameId: game.id}})),
    fallback: true, // false or "blocking"
  }
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, `${params!.gameId}`),
  });
  const playersData = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, gameData!.activePlayerIds), 
  });
  return { props: { gameData: gameData!, playersData } }
}) satisfies GetStaticProps<{
  gameData: typeof games.$inferSelect;
  playersData: PlayerType[];
}>

export default function GamePage({
  gameData, playersData,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const { id: gameId, vsTeamName, teamScore, vsTeamScore } = gameData;
  const {
    genderRatio,
    playerLimitL,
    playerLimitR,
    oOrD,
    fieldSide,
  } = calculatePointInfo(gameData);

  const [selectedPlayersL, setSelectedPlayersL] = useState([] as string[]);
  const [selectedPlayersR, setSelectedPlayersR] = useState([] as string[]);
  const { playersL, playersR } = splitPlayersByGenderMatch(playersData);

  const handleClearButtonClick = () => {
    setSelectedPlayersL([]);
    setSelectedPlayersR([]);
  }

  const handleSubmitButtonClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    // const pointData = {
    //   gameId,
    //   playerIds: selectedPlayersL.concat(selectedPlayersR),
    // } satisfies typeof points.$inferInsert;
      
    // TODO LATER: consider making this work? doesn't like something about drizzle inserts
    // const [result] = await db.insert(points).values(pointData).returning({ pointId: points.id });

    const res = await fetch(`http://localhost:3000/api/games/${gameId}/point`, {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerIds: selectedPlayersL.concat(selectedPlayersR),
      }),
    });
    const { pointId } = await res.json();
    router.push(`/points/${pointId}`);
  }

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{ ...colStackStyles, mt: 1 }}
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
        Select players for this line:
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
            const playerSelected = selectedPlayersL.includes(player.id);
            return (
              <PlayerButton
                key={player.id}
                variant={playerSelected ? 'solid' : 'outlined'}
                disabled={selectedPlayersL.length >= playerLimitL && !playerSelected}
                onClick={() => {
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
                disabled={selectedPlayersR.length >= playerLimitR && !playerSelected}
                onClick={() => {
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
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          width: "95%",
        }}
      >
        <Button disabled>Halftime</Button>
        <Stack
          direction="row"
          spacing={1}
        >
          <Button
            variant="outlined"
            onClick={handleClearButtonClick}
          >
            Clear Line
          </Button>
          <Button
            disabled={selectedPlayersL.length + selectedPlayersR.length < 7}
            onClick={handleSubmitButtonClick}
          >
            Start Point
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
