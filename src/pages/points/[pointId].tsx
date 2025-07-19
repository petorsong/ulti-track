import { useState } from 'react';
import type { InferGetStaticPropsType, GetStaticProps, GetStaticPaths } from 'next'
import { useRouter } from 'next/router';
import { db } from '@/database/drizzle';
import { EventTypeTS, PlayerType, pointEvents, points } from '@/database/schema'
import { Accordion, AccordionDetails, AccordionSummary, Button, Divider, Stack, Typography } from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import { Undo } from '@mui/icons-material';

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

export default function PointPage({
  pointData, playersData,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const pointId = pointData!.id;
  const gameData = pointData!.game!;
  const { vsTeamName, teamScore, vsTeamScore } = gameData;
  const { genderRatio, oOrD, fieldSide } = calculatePointInfo(gameData);
  const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
  const [selectedPlayerId, setSelectedPlayer] = useState('');
  const [events, setEvents] = useState([] as typeof pointEvents.$inferInsert[]);

  const handlePlayerClick = (playerId: string) => {
    if (!selectedPlayerId) {
      setSelectedPlayer(playerId);
    } else if (playerId == selectedPlayerId) {
      setSelectedPlayer('');
    } else {
      setEvents(events.concat({
        pointId,
        type: 'PASS',
        playerOneId: selectedPlayerId,
        playerTwoId: playerId,
      }));
      setSelectedPlayer(playerId);
    }
  }

  const handleUndoClick = () => {
    const lastIndex = events.length-1;
    const lastEvent = events[lastIndex];
    setSelectedPlayer(lastEvent.playerOneId ?? '');
    setEvents(events.slice(0, lastIndex));
  }

  const handleDiscActionClick = (type: EventTypeTS) => {
    setEvents(events.concat({
      pointId,
      type,
      playerOneId: selectedPlayerId,
    }));
    setSelectedPlayer('');
  }

  const handleScoreClick = async (e: React.MouseEvent<HTMLElement>, type: EventTypeTS) => {
    e.preventDefault();
    const scoreEvent = { pointId, type } as typeof pointEvents.$inferInsert;
    if (type == 'SCORE') {
      scoreEvent.playerOneId = selectedPlayerId;
    }

    const res = await fetch(`/api/points/${pointId}/events`, {
      method: 'POST',
      body: JSON.stringify(events.concat(scoreEvent)),
    });

    const { redirectRoute } = await res.json();
    router.push(redirectRoute);
  }

  return (
    <Stack
      direction="column"
      spacing={2}
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
      <Typography level="title-sm">
        Track player stats for point (let em cook):
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
                variant={selectedPlayerId == player.id ? 'solid' : 'outlined'}
                onClick={() => handlePlayerClick(player.id)}
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
                variant={selectedPlayerId == player.id ? 'solid' : 'outlined'}
                onClick={() => handlePlayerClick(player.id)}
                {...player}
              />
            );
          })}
        </Stack>
      </Stack>
      <Divider sx={{ width: "95%", alignSelf: "center" }} />
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "space-between",
          width: "95%",
        }}
      >
        <Button
          variant='soft'
          size='lg'
          color='danger'
          fullWidth
          disabled={!selectedPlayerId}
          onClick={() => handleDiscActionClick('TA')}
        >
          Throwaway
        </Button>
        <Button
          variant='soft'
          size='lg'
          color='danger'
          fullWidth
          disabled={!selectedPlayerId}
          onClick={() => handleDiscActionClick('DROP')}
        >
          Drop
        </Button>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "space-between",
          width: "95%",
        }}
      >
        <Button
          variant='soft'
          size='lg'
          color='success'
          fullWidth
          disabled={!selectedPlayerId}
          onClick={() => handleDiscActionClick('D')}
        >
          D
        </Button>
        <Button
          variant='soft'
          size='lg'
          color='neutral'
          fullWidth
          endDecorator={<Undo/>}
          disabled={events.length == 0}
          onClick={handleUndoClick}
        >
          Undo Last
        </Button>
      </Stack>
      <Accordion>
        <AccordionSummary>Last: </AccordionSummary>
        <AccordionDetails>
          <Stack
            direction="column"
            spacing={0.5}
            sx={colStackStyles}
          >
            {events.toReversed().map((e, i) => (
              <Typography key={i} level="title-sm">
                {JSON.stringify(e)}
              </Typography>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>More events</AccordionSummary>
        <AccordionDetails>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "space-between",
              width: "95%",
            }}
          >
            <Button variant='outlined' size='lg' color='neutral' fullWidth>
              OUR timeout
            </Button>
            <Button variant='outlined' size='lg' color='warning' fullWidth>
              THEIR timeout
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "space-between",
          width: "95%",
        }}
      >
        <Button
          variant='solid'
          size='lg'
          color='success'
          fullWidth
          disabled={!selectedPlayerId}
          onClick={(e) => handleScoreClick(e, 'SCORE')}
        >
          WE scored
        </Button>
        <Button
          variant='solid'
          size='lg'
          color='danger'
          fullWidth
          onClick={(e) => handleScoreClick(e, 'VS_SCORE')}
        >
          THEY scored
        </Button>
      </Stack>
    </Stack>
  )
};