import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EventTypeTS, games, players, PlayerWithLineCountType, pointEvents } from '@/database/schema';
import {
  Accordion,
  AccordionDetails,
  AccordionGroup,
  AccordionSummary,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, handleEndHalfButtonClick, splitPlayersByGenderMatch } from '@/utils';
import { GroupRemove, Undo } from '@mui/icons-material';
import LastEventAccordion from '@/components/LastEventAccordion';

export default function PointPage() {
  const router = useRouter();
  const pointId = router.query.pointId as string;

  const [currentPlayersL, setCurrentPlayersL] = useState([] as (typeof players.$inferSelect)[]);
  const [currentPlayersR, setCurrentPlayersR] = useState([] as (typeof players.$inferSelect)[]);
  const [selectedCurrentPlayerId, setSelectedCurrentPlayerId] = useState('');
  const [events, setEvents] = useState([] as (typeof pointEvents.$inferInsert)[]);
  const [nextPointInfo, setNextPointInfo] = useState({
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
    isFirstHalf: true,
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
    isFirstHalf: true,
  });
  const [nextPlayersL, setNextPlayersL] = useState([] as (typeof players.$inferSelect)[]);
  const [nextPlayersR, setNextPlayersR] = useState([] as (typeof players.$inferSelect)[]);
  const [nextPlayerLimitL, setNextPlayerLimitL] = useState(0);
  const [nextPlayerLimitR, setNextPlayerLimitR] = useState(0);
  const [selectedNextPlayersL, setSelectedNextPlayersL] = useState([] as string[]);
  const [selectedNextPlayersR, setSelectedNextPlayersR] = useState([] as string[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/points/${pointId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.gameData as typeof games.$inferSelect;
        const playersData = data.playersData as PlayerWithLineCountType[];
        const activePlayerIds = data.pointData.playerIds as string[];

        setCurrentPointInfo({ ...gameData, ...calculatePointInfo(gameData) });
        setHalftimeAt(gameData.halftimeAt);
        setGameId(gameData.id);

        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setNextPlayersL(playersL);
        setNextPlayersR(playersR);
        setCurrentPlayersL(playersL.filter((player) => activePlayerIds.includes(player.id)));
        setCurrentPlayersR(playersR.filter((player) => activePlayerIds.includes(player.id)));

        const nextPointInfo = calculatePointInfo({
          ...gameData,
          teamScore: gameData.teamScore + 1,
        });
        setNextPointInfo(nextPointInfo);
        setNextPlayerLimitL(nextPointInfo.playerLimitL);
        setNextPlayerLimitR(nextPointInfo.playerLimitR);

        setIsLoading(false);
      });
  }, [pointId, router.isReady]);

  const handleClearButtonClick = () => {
    setSelectedNextPlayersL([]);
    setSelectedNextPlayersR([]);
  };

  const handlePlayerClick = (playerId: string) => {
    if (!selectedCurrentPlayerId) {
      // TODO: only toggle for pickup
      setSelectedCurrentPlayerId(playerId);
    } else if (playerId == selectedCurrentPlayerId) {
      setSelectedCurrentPlayerId('');
    } else {
      setEvents(
        events.concat({
          pointId,
          type: 'PASS',
          playerOneId: selectedCurrentPlayerId,
          playerTwoId: playerId,
        })
      );
      setSelectedCurrentPlayerId(playerId);
    }
  };

  const handleUndoClick = () => {
    const lastIndex = events.length - 1;
    const lastEvent = events[lastIndex];
    setSelectedCurrentPlayerId(lastEvent.playerOneId ?? '');
    setEvents(events.slice(0, lastIndex));
  };

  const handleDiscActionClick = (type: EventTypeTS) => {
    setEvents(
      events.concat({
        pointId,
        type,
        playerOneId: selectedCurrentPlayerId,
      })
    );
    setSelectedCurrentPlayerId('');
  };

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
  };

  return (
    !isLoading && (
      <Stack direction="column" spacing={2} sx={{ ...colStackStyles, mt: 1 }}>
        <PointCard {...currentPointInfo} />
        <Typography level="title-sm">Track player stats for point (let em cook):</Typography>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <Stack direction="column" spacing={1} sx={colStackStyles}>
            {currentPlayersL.map((player) => {
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
          <Stack direction="column" spacing={1} sx={colStackStyles}>
            {currentPlayersR.map((player) => {
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
        <Divider sx={{ width: '95%', alignSelf: 'center' }} />
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: 'space-between',
            width: '95%',
          }}
        >
          <Button
            variant="soft"
            size="lg"
            color="danger"
            fullWidth
            disabled={!selectedCurrentPlayerId}
            onClick={() => handleDiscActionClick('TA')}
          >
            Throwaway
          </Button>
          <Button
            variant="soft"
            size="lg"
            color="danger"
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
            justifyContent: 'space-between',
            width: '95%',
          }}
        >
          <Button
            variant="soft"
            size="lg"
            color="success"
            fullWidth
            disabled={!selectedCurrentPlayerId}
            onClick={() => handleDiscActionClick('D')}
          >
            D
          </Button>
          <Button
            variant="soft"
            size="lg"
            color="neutral"
            fullWidth
            endDecorator={<Undo />}
            disabled={events.length == 0}
            onClick={handleUndoClick}
          >
            Undo Last
          </Button>
        </Stack>
        <LastEventAccordion {...{ events, players: currentPlayersL.concat(currentPlayersR) }} />
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: 'space-between',
            width: '95%',
          }}
        >
          <Button
            variant="solid"
            size="lg"
            color="success"
            fullWidth
            disabled={!selectedCurrentPlayerId}
            onClick={(e) => handleScoreClick(e, 'SCORE')}
          >
            WE scored
          </Button>
          <Button variant="solid" size="lg" color="danger" fullWidth onClick={(e) => handleScoreClick(e, 'VS_SCORE')}>
            THEY scored
          </Button>
        </Stack>
        <Button
          variant="soft"
          color="neutral"
          sx={{ width: '95%' }}
          onClick={(e) => handleEndHalfButtonClick(e, gameId, router, setCurrentPointInfo)}
        >
          {halftimeAt ? 'End Game' : 'Halftime'}
        </Button>
        <AccordionGroup size="lg" sx={{ width: '100%' }}>
          <Accordion>
            <AccordionSummary>Next Line</AccordionSummary>
            <AccordionDetails>
              <Stack direction="column" spacing={0.5} sx={colStackStyles}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: 'space-between',
                    width: '95%',
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    <Chip
                      variant="soft"
                      color={nextPointInfo.genderRatio[0] == 'F' ? 'primary' : 'warning'}
                      size="lg"
                      sx={{ justifyContent: 'center' }}
                    >
                      {nextPointInfo.genderRatio}
                    </Chip>
                    <Chip variant="soft" size="lg" sx={{ justifyContent: 'center' }}>
                      {nextPointInfo.fieldSide}
                    </Chip>
                  </Stack>
                  <Button
                    variant="soft"
                    color="neutral"
                    sx={{ width: '47.5%' }}
                    endDecorator={<GroupRemove />}
                    disabled={selectedNextPlayersL.length + selectedNextPlayersR.length == 0}
                    onClick={handleClearButtonClick}
                  >
                    Clear Line
                  </Button>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    width: '100%',
                  }}
                >
                  <Stack direction="column" spacing={1} sx={colStackStyles}>
                    {nextPlayersL.map((player) => {
                      const playerSelected = selectedNextPlayersL.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'soft'}
                          disabled={selectedNextPlayersL.length >= nextPlayerLimitL && !playerSelected}
                          onClick={() => {
                            setSelectedNextPlayersL(
                              playerSelected
                                ? selectedNextPlayersL.filter((p) => p != player.id)
                                : selectedNextPlayersL.concat(player.id)
                            );
                          }}
                          {...player}
                        />
                      );
                    })}
                  </Stack>
                  <Stack direction="column" spacing={1} sx={colStackStyles}>
                    {nextPlayersR.map((player) => {
                      const playerSelected = selectedNextPlayersR.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'soft'}
                          disabled={selectedNextPlayersR.length >= nextPlayerLimitR && !playerSelected}
                          onClick={() => {
                            setSelectedNextPlayersR(
                              playerSelected
                                ? selectedNextPlayersR.filter((p) => p != player.id)
                                : selectedNextPlayersR.concat(player.id)
                            );
                          }}
                          {...player}
                        />
                      );
                    })}
                  </Stack>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Stack>
    )
  );
}
