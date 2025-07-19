import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventTypeTS, games, players, PlayerWithLineCountType, pointEvents } from '@/database/schema'
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Button, Chip, Divider, Stack, Typography } from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import { Undo } from '@mui/icons-material';

export default function PointPage() {
  const router = useRouter();
  const { pointId: rawPointId } = router.query;
  const pointId = `${rawPointId}`;

  const [currentPlayersL, setcurrentPlayersL] = useState([] as typeof players.$inferSelect[]);
  const [currentPlayersR, setcurrentPlayersR] = useState([] as typeof players.$inferSelect[]);
  const [selectedCurrentPlayerId, setSelectedCurrentPlayerId] = useState('');
  const [events, setEvents] = useState([] as typeof pointEvents.$inferInsert[]);
  const [nextPointInfo, setNextPointInfo] = useState({
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
  });
  const [halftimeAt, setHalftimeAt] = useState(null as number | null);
  const [gameId, setGameId] = useState('');

  // same as [gameId] but renamed
  const [isLoading, setIsLoading] = useState(true);
  const [currentPointInfo, setCurrentPointInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
  });
  const [nextPlayersL, setNextPlayersL] = useState([] as typeof players.$inferSelect[]);
  const [nextPlayersR, setNextPlayersR] = useState([] as typeof players.$inferSelect[]);
  const [nextPlayerLimitL, setNextPlayerLimitL] = useState(0);
  const [nextPlayerLimitR, setNextPlayerLimitR] = useState(0);
  const [selectedNextPlayersL, setSelectedNextPlayersL] = useState([] as string[]);
  const [selectedNextPlayersR, setSelectedNextPlayersR] = useState([] as string[]);

  useEffect(() => {
    fetch(`/api/points/${pointId}`)
      .then(res => res.json())
      .then((data) => {
        const gameData = data.gameData as typeof games.$inferSelect;
        const playersData = data.playersData as PlayerWithLineCountType[];
        const activePlayerIds = data.pointData.playerIds as string[];

        const { vsTeamName, teamScore, vsTeamScore } = gameData;
        const { genderRatio, oOrD, fieldSide } = calculatePointInfo(gameData);        
        setCurrentPointInfo({ vsTeamName: vsTeamName!, teamScore: teamScore!, vsTeamScore: vsTeamScore!, genderRatio, oOrD, fieldSide });
        setHalftimeAt(gameData.halftimeAt);
        setGameId(gameData.id);

        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setNextPlayersL(playersL);
        setNextPlayersR(playersR);
        setcurrentPlayersL(playersL.filter(player => activePlayerIds.includes(player.id)));
        setcurrentPlayersR(playersR.filter(player => activePlayerIds.includes(player.id)));

        const nextPointInfo = calculatePointInfo({...gameData, teamScore: teamScore!+1});
        setNextPointInfo(nextPointInfo);
        setNextPlayerLimitL(nextPointInfo.playerLimitL);
        setNextPlayerLimitR(nextPointInfo.playerLimitR);

        setIsLoading(false);
      });
  }, [pointId]);

  const handleClearButtonClick = () => {
    setSelectedNextPlayersL([]);
    setSelectedNextPlayersR([]);
  }

  const handlePlayerClick = (playerId: string) => {
    if (!selectedCurrentPlayerId) {
      setSelectedCurrentPlayerId(playerId);
    } else if (playerId == selectedCurrentPlayerId) {
      setSelectedCurrentPlayerId('');
    } else {
      setEvents(events.concat({
        pointId,
        type: 'PASS',
        playerOneId: selectedCurrentPlayerId,
        playerTwoId: playerId,
      }));
      setSelectedCurrentPlayerId(playerId);
    }
  }

  const handleUndoClick = () => {
    const lastIndex = events.length-1;
    const lastEvent = events[lastIndex];
    setSelectedCurrentPlayerId(lastEvent.playerOneId ?? '');
    setEvents(events.slice(0, lastIndex));
  }

  const handleDiscActionClick = (type: EventTypeTS) => {
    setEvents(events.concat({
      pointId,
      type,
      playerOneId: selectedCurrentPlayerId,
    }));
    setSelectedCurrentPlayerId('');
  }

  const handleScoreClick = async (e: React.MouseEvent<HTMLElement>, type: EventTypeTS) => {
    e.preventDefault();
    const scoreEvent = { pointId, type } as typeof pointEvents.$inferInsert;
    if (type == 'SCORE') {
      scoreEvent.playerOneId = selectedCurrentPlayerId;
    }

    const res = await fetch(`/api/points/${pointId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        events: events.concat(scoreEvent),
        nextPlayerIds: selectedNextPlayersL.concat(selectedNextPlayersR),
      }),
    });

    const { redirectRoute } = await res.json();
    router.push(redirectRoute);
  }

  const handleHalfOrEndButtonClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    fetch(`/api/games/${gameId}/end-half`, { method: 'POST' })
      .then(res => res.json())
      .then((data) => {
        const gameData = data.gameData as typeof games.$inferSelect;
        if (gameData.isComplete) {
          router.push(`/games/${gameId}/summary`);
        } else {
          const { vsTeamName, teamScore, vsTeamScore } = gameData;
          const { genderRatio, oOrD, fieldSide } = calculatePointInfo(gameData);        
          setCurrentPointInfo({ vsTeamName: vsTeamName!, teamScore: teamScore!, vsTeamScore: vsTeamScore!, genderRatio, oOrD, fieldSide });
        }
      });
  }

  return !isLoading && (
    <Stack
      direction="column"
      spacing={2}
      sx={{...colStackStyles, mt: 1}}
    >
      <PointCard {...currentPointInfo} />
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
          {currentPlayersL.map(player => {
            return (
              <PlayerButton
                key={player.id}
                variant={selectedCurrentPlayerId == player.id ? 'solid' : 'outlined'}
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
          {currentPlayersR.map(player => {
            return (
              <PlayerButton
                key={player.id}
                variant={selectedCurrentPlayerId == player.id ? 'solid' : 'outlined'}
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
          disabled={!selectedCurrentPlayerId}
          onClick={() => handleDiscActionClick('TA')}
        >
          Throwaway
        </Button>
        <Button
          variant='soft'
          size='lg'
          color='danger'
          fullWidth
          disabled={!selectedCurrentPlayerId}
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
          disabled={!selectedCurrentPlayerId}
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
      {/* <Accordion>
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
      </Accordion> */}
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
          disabled={!selectedCurrentPlayerId}
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
      <Button
        variant="soft"
        color='neutral'
        sx={{ width:'95%' }}
        onClick={(e) => handleHalfOrEndButtonClick(e)}
      >
        {halftimeAt ? 'End Game' : 'Halftime'}
      </Button>
      <AccordionGroup size='lg' sx={{ width: '100%' }}>
        <Accordion>
          <AccordionSummary>Next Line</AccordionSummary>
          <AccordionDetails>
            <Stack
              direction="column"
              spacing={0.5}
              sx={colStackStyles}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  width: "95%",
                }}
              >
                <Chip
                  variant="soft"
                  color={nextPointInfo.genderRatio[0] == 'F' ? 'primary' : 'warning'}
                  size="lg"
                  sx={{ justifyContent: 'center' }}
                >
                  {nextPointInfo.genderRatio}
                </Chip>
                <Chip
                  variant="soft"
                  size="lg"
                  sx={{ justifyContent: 'center' }}
                >
                  {nextPointInfo.fieldSide}
                </Chip>
              </Stack>
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
                  {nextPlayersL.map(player => {
                    const playerSelected = selectedNextPlayersL.includes(player.id);
                    return (
                      <PlayerButton
                        key={player.id}
                        variant={playerSelected ? 'solid' : 'soft'}
                        disabled={selectedNextPlayersL.length >= nextPlayerLimitL && !playerSelected}
                        onClick={() => {
                          setSelectedNextPlayersL(playerSelected
                            ? selectedNextPlayersL.filter((p) => p != player.id)
                            : selectedNextPlayersL.concat(player.id));
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
                  {nextPlayersR.map(player => {
                    const playerSelected = selectedNextPlayersR.includes(player.id);
                    return (
                      <PlayerButton
                        key={player.id}
                        variant={playerSelected ? 'solid' : 'soft'}
                        disabled={selectedNextPlayersR.length >= nextPlayerLimitR && !playerSelected}
                        onClick={() => {
                          setSelectedNextPlayersR(playerSelected
                            ? selectedNextPlayersR.filter((p) => p != player.id)
                            : selectedNextPlayersR.concat(player.id));
                        }}
                        {...player}
                      />
                    );
                  })}
                </Stack>
              </Stack>
              <Button
                variant="soft"
                color='neutral'
                sx={{ width:'100%' }}
                disabled={selectedNextPlayersL.length + selectedNextPlayersR.length == 0}
                onClick={handleClearButtonClick}
              >
                Clear Line
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </AccordionGroup>
    </Stack>
  )
};