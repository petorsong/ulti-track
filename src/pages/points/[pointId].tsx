import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from '@mui/joy';
import type {
  EventType,
  Game,
  InsertPointEvent,
  Player,
  PlayerWithLineCount,
  TeamGroup,
  TimeoutsJson,
} from '@/database/schema';
import { DiscActionsButtons, LastEventAccordion, NextLineModal, PlayerButton, PointCard } from '@/components';
import { calculatePointInfo, colStackStyles, handleEndHalfButtonClick, splitPlayersByGenderMatch } from '@/utils';

export default function PointPage() {
  const router = useRouter();
  const pointId = router.query.pointId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [saveFrom, setSaveFrom] = useState('');
  const [nextLineModalOpen, setNextLineModalOpen] = useState(false);

  const [currentPlayersL, setCurrentPlayersL] = useState([] as Player[]);
  const [currentPlayersR, setCurrentPlayersR] = useState([] as Player[]);
  const [selectedCurrentPlayerId, setSelectedCurrentPlayerId] = useState('');
  const [events, setEvents] = useState([] as InsertPointEvent[]);
  const [nextPointInfo, setNextPointInfo] = useState({
    genderRatio: '',
    fieldSide: '',
    playerLimitL: 0,
    playerLimitR: 0,
  });
  const [game, setGame] = useState({} as Game);
  const [teamGroups, setTeamGroups] = useState([] as TeamGroup[]);
  const [timeouts, setTimeouts] = useState({} as TimeoutsJson);

  const [currentPointInfo, setCurrentPointInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
    isFirstHalf: true,
  });
  const [nextPlayersL, setNextPlayersL] = useState([] as Player[]);
  const [nextPlayersR, setNextPlayersR] = useState([] as Player[]);
  const [selectedNextPlayersL, setSelectedNextPlayersL] = useState([] as string[]);
  const [selectedNextPlayersR, setSelectedNextPlayersR] = useState([] as string[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/points/${pointId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.game as Game;
        const playersData = data.players as PlayerWithLineCount[];
        const teamGroupsData = data.teamGroups as TeamGroup[];
        const activePlayerIds = data.point.playerIds as string[];

        setTeamGroups(teamGroupsData);
        setGame(gameData);
        setTimeouts(gameData.timeouts);
        setCurrentPointInfo({ ...gameData, ...calculatePointInfo(gameData) });

        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setNextPlayersL(playersL);
        setNextPlayersR(playersR);
        setCurrentPlayersL(playersL.filter((player) => activePlayerIds.includes(player.id)));
        setCurrentPlayersR(playersR.filter((player) => activePlayerIds.includes(player.id)));

        setNextPointInfo({
          ...calculatePointInfo({
            ...gameData,
            teamScore: gameData.teamScore + 1,
          }),
        });

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
    if (['TIMEOUT', 'VS_TIMEOUT'].includes(lastEvent.type)) {
      const currentHalf = game.halftimeAt ? 'secondHalf' : 'firstHalf';
      const updatedTimeouts = { ...timeouts };
      if (lastEvent.type === 'TIMEOUT') {
        updatedTimeouts.ourTimeouts[currentHalf]++;
      } else {
        updatedTimeouts.vsTimeouts[currentHalf]++;
      }
      setTimeouts(updatedTimeouts);
    }
    setEvents(events.slice(0, lastIndex));
  };

  const handleDiscActionClick = (type: EventType) => {
    setEvents(
      events.concat({
        pointId,
        type,
        playerOneId: selectedCurrentPlayerId,
      })
    );
    setSelectedCurrentPlayerId('');
  };

  const handleTimeoutClick = (isOurTimeout: boolean) => {
    const currentHalf = game.halftimeAt ? 'secondHalf' : 'firstHalf';
    const updatedTimeouts = { ...timeouts };
    if (isOurTimeout) {
      updatedTimeouts.ourTimeouts[currentHalf]--;
    } else {
      updatedTimeouts.vsTimeouts[currentHalf]--;
    }

    setTimeouts(updatedTimeouts);
    if (!isOurTimeout) {
      setSelectedCurrentPlayerId('');
    }
    setEvents(
      events.concat({
        pointId,
        type: isOurTimeout ? 'TIMEOUT' : 'VS_TIMEOUT',
      })
    );
  };

  const handleScoreClick = async (e: React.MouseEvent<HTMLElement>, type: EventType) => {
    e.preventDefault();
    setSaveFrom(type.toString());
    const scoreEvent = { pointId, type } as InsertPointEvent;
    if (type == 'SCORE') {
      scoreEvent.playerOneId = selectedCurrentPlayerId;
    }

    const res = await fetch(`/api/points/${pointId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        events: events.concat(scoreEvent),
        nextPlayerIds: selectedNextPlayersL.concat(selectedNextPlayersR),
        timeouts,
      }),
    });

    setSaveFrom(''); // clear all state for if we stay on this page
    setEvents([]);
    setSelectedCurrentPlayerId('');
    setSelectedNextPlayersL([]);
    setSelectedNextPlayersR([]);
    const { redirectRoute } = await res.json();
    router.push(redirectRoute);
  };

  return (
    !isLoading && (
      <Stack direction="column" spacing={2} sx={{ ...colStackStyles, mt: 1 }}>
        <PointCard {...currentPointInfo} />
        <Typography level="title-sm">Track player stats for point (let em cook):</Typography>
        <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
          {[currentPlayersL, currentPlayersR].map((playerList, i) => (
            <Stack key={`playerList${i}`} direction="column" spacing={1} sx={colStackStyles}>
              {playerList.map((player) => {
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
          ))}
        </Stack>
        <Divider sx={{ width: '95%', alignSelf: 'center' }} />
        <DiscActionsButtons
          disableDiscAction={!selectedCurrentPlayerId}
          disableUndo={events.length == 0}
          onDiscActionClick={handleDiscActionClick}
          onUndoClick={handleUndoClick}
        />
        <LastEventAccordion {...{ events, players: currentPlayersL.concat(currentPlayersR) }} />
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
          <Button
            variant="solid"
            size="lg"
            color="success"
            fullWidth
            disabled={!selectedCurrentPlayerId}
            loading={saveFrom == 'SCORE'}
            onClick={(e) => handleScoreClick(e, 'SCORE')}
          >
            WE scored
          </Button>
          <Button
            variant="solid"
            size="lg"
            color="danger"
            fullWidth
            loading={saveFrom == 'VS_SCORE'}
            onClick={(e) => handleScoreClick(e, 'VS_SCORE')}
          >
            THEY scored
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
          <Button
            variant="soft"
            size="lg"
            color="neutral"
            fullWidth
            loading={saveFrom == 'HALFTIME'}
            onClick={(e) => {
              setSaveFrom('HALFTIME');
              handleEndHalfButtonClick(e, game.id, router, setCurrentPointInfo);
            }}
          >
            {game.halftimeAt ? 'End Game' : 'Halftime'}
          </Button>
          <Button variant="soft" size="lg" color="primary" fullWidth onClick={() => setNextLineModalOpen(true)}>
            Next line ({selectedNextPlayersL.length + selectedNextPlayersR.length}/7)
          </Button>
          <Modal open={nextLineModalOpen} onClose={() => setNextLineModalOpen(false)}>
            <ModalDialog layout="fullscreen">
              <ModalClose />
              <NextLineModal
                onClearLineClick={handleClearButtonClick}
                onSaveLineClick={() => setNextLineModalOpen(false)}
                {...{
                  nextPointInfo,
                  selectedNextPlayersL,
                  selectedNextPlayersR,
                  nextPlayersL,
                  nextPlayersR,
                  setSelectedNextPlayersL,
                  setSelectedNextPlayersR,
                  teamGroups,
                }}
              />
            </ModalDialog>
          </Modal>
        </Stack>
        <Accordion sx={{ width: '95%' }}>
          <AccordionSummary sx={{ justifyContent: 'space-between' }}>More:</AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%', mt: 1 }}>
              {[
                { type: 'TIMEOUT', label: 'OUR', color: 'primary', source: timeouts.ourTimeouts },
                { type: 'VS_TIMEOUT', label: 'THEIR', color: 'warning', source: timeouts.vsTimeouts },
              ].map(({ type, label, color, source }) => {
                const currentHalf = game.halftimeAt ? 'secondHalf' : 'firstHalf';
                const timeoutsLeft = source[currentHalf];

                return (
                  <Button
                    key={type}
                    variant="soft"
                    size="lg"
                    color={color as 'primary' | 'warning'}
                    fullWidth
                    disabled={timeoutsLeft === 0}
                    onClick={() => handleTimeoutClick(type == 'TIMEOUT')}
                  >
                    {`${label} TIMEOUT (${timeoutsLeft}/${timeouts.perHalf} this half)`}
                  </Button>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    )
  );
}
