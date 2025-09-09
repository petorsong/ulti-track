import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Edit from '@mui/icons-material/Edit';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Divider, Stack, Typography } from '@mui/joy';
import type {
  EventType,
  Game,
  InsertPointEvent,
  PlayerWithLineCount,
  Point,
  TeamWithTeamGroups,
  TimeoutsJson,
} from '@/database/schema';
import {
  DiscActionsButtons,
  LastEventAccordion,
  SelectLineModal,
  PlayerButton,
  PointCard,
  BottomDialog,
} from '@/components';
import {
  calculatePointInfo,
  COL_STACK_STYLES,
  handleEndHalfButtonClick,
  POINT_INFO_DEFAULT,
  splitPlayers,
} from '@/utils';

export default function PointPage() {
  const router = useRouter();
  const pointId = router.query.pointId as string;

  // component mutated state
  const [isLoading, setIsLoading] = useState(true);
  const [saveFrom, setSaveFrom] = useState('');
  const [modalsOpen, setModalsOpen] = useState({ nextLine: false, editLine: false, confirmScore: false });

  const [selectedCurrentPlayerId, setSelectedCurrentPlayerId] = useState('');
  const [events, setEvents] = useState([] as InsertPointEvent[]);
  const [timeouts, setTimeouts] = useState({} as TimeoutsJson);
  const [currentPlayersIdsL, setCurrentPlayersIdsL] = useState([] as string[]);
  const [currentPlayersIdsR, setCurrentPlayersIdsR] = useState([] as string[]);
  const [selectedNextPlayersL, setSelectedNextPlayersL] = useState([] as string[]);
  const [selectedNextPlayersR, setSelectedNextPlayersR] = useState([] as string[]);

  // read-only data
  const [gameTeamData, setGameTeamData] = useState({
    game: {} as Game,
    teamWithGroups: {} as TeamWithTeamGroups,
    players: { left: [] as PlayerWithLineCount[], right: [] as PlayerWithLineCount[] },
    initialPlayers: { left: [] as PlayerWithLineCount[], right: [] as PlayerWithLineCount[] },
    lastLinePlayerIds: [] as string[],
  });
  const [nextPointInfo, setNextPointInfo] = useState({
    genderRatio: null as string | null,
    fieldSide: '',
    playerLimitL: 0 as number | null,
    playerLimitR: 0 as number | null,
  });
  const [currentPointInfo, setCurrentPointInfo] = useState(POINT_INFO_DEFAULT);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/points/${pointId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.game as Game;
        const playersData = data.players as PlayerWithLineCount[];
        const teamData = data.team as TeamWithTeamGroups;
        const activePlayerIds = data.playerIds as string[];
        const lastPointData = data.lastPoint as Point;

        setTimeouts(gameData.timeouts);
        setCurrentPointInfo({ ...gameData, ...calculatePointInfo(gameData) });
        setNextPointInfo({ ...calculatePointInfo({ ...gameData, teamScore: gameData.teamScore + 1 }) });
        const { playersL, playersR } = splitPlayers(playersData, teamData.type);
        const linePlayersL = playersL.filter((player) => activePlayerIds.includes(player.id));
        const linePlayersR = playersR.filter((player) => activePlayerIds.includes(player.id));
        setCurrentPlayersIdsL(linePlayersL.map((player) => player.id));
        setCurrentPlayersIdsR(linePlayersR.map((player) => player.id));
        setGameTeamData({
          game: gameData,
          teamWithGroups: teamData,
          players: { left: playersL, right: playersR },
          initialPlayers: { left: linePlayersL, right: linePlayersR },
          lastLinePlayerIds: lastPointData.playerIds,
        });
        setIsLoading(false);
      });
  }, [pointId, router.isReady]);

  const updateModals = (name: 'nextLine' | 'editLine' | 'confirmScore', isOpen: boolean) => {
    setModalsOpen({ ...modalsOpen, [name]: isOpen });
  };

  const handleNextLineSave = (players: { left: string[]; right: string[] }) => () => {
    setSelectedNextPlayersL(players.left);
    setSelectedNextPlayersR(players.right);
    updateModals('nextLine', false);
  };

  const handleEditLineSave = (players: { left: string[]; right: string[] }) => () =>
    fetch(`/api/points/${pointId}/edit-line`, {
      method: 'POST',
      body: JSON.stringify(players.left.concat(players.right)),
    }).then(() => router.reload());

  const handlePlayerClick = (playerId: string) => {
    if (!selectedCurrentPlayerId) {
      // TODO: only toggle for pickup
      setSelectedCurrentPlayerId(playerId);
    } else if (playerId == selectedCurrentPlayerId) {
      setSelectedCurrentPlayerId('');
    } else {
      setEvents(events.concat({ pointId, type: 'PASS', playerOneId: selectedCurrentPlayerId, playerTwoId: playerId }));
      setSelectedCurrentPlayerId(playerId);
    }
  };

  const handleUndoLast = () => {
    const lastIndex = events.length - 1;
    const lastEvent = events[lastIndex];
    setSelectedCurrentPlayerId(lastEvent.playerOneId ?? '');
    if (['TIMEOUT', 'VS_TIMEOUT'].includes(lastEvent.type)) {
      const currentHalf = gameTeamData.game.halftimeAt ? 'secondHalf' : 'firstHalf';
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

  const handleDiscAction = (type: EventType) => {
    setEvents(
      events.concat({
        pointId,
        type,
        playerOneId: selectedCurrentPlayerId,
      })
    );
    setSelectedCurrentPlayerId('');
  };

  const handleTimeout = (isOurTimeout: boolean) => {
    const currentHalf = gameTeamData.game.halftimeAt ? 'secondHalf' : 'firstHalf';
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

  const handleConfirmScoreClose = () => {
    setSaveFrom('');
    updateModals('confirmScore', false);
  };

  const confirmScore = (e: React.MouseEvent<HTMLElement>, type: EventType) => {
    e.preventDefault();
    setSaveFrom(type.toString()); // TODO: perhaps track score type separately
    updateModals('confirmScore', true);
  };

  const handleScore = async (type: 'SCORE' | 'VS_SCORE') => {
    updateModals('confirmScore', false);
    const scoreEvent = { pointId, type } as InsertPointEvent;
    if (type == 'SCORE') {
      scoreEvent.playerOneId = selectedCurrentPlayerId;
    }

    const res = await fetch(`/api/points/${pointId}/end-point`, {
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
      <Stack direction="column" spacing={2} sx={{ ...COL_STACK_STYLES, mt: 1 }}>
        <PointCard {...currentPointInfo} />
        <Typography level="title-sm">Track player stats for point (let em cook):</Typography>
        <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
          {Object.values(gameTeamData.initialPlayers).map((playerList, i) => (
            <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
              {playerList.map((player) => (
                <PlayerButton
                  key={player.id}
                  variant={selectedCurrentPlayerId == player.id ? 'solid' : 'outlined'}
                  colour={i == 0 ? 'primary' : 'success'}
                  onClick={() => handlePlayerClick(player.id)}
                  {...player}
                />
              ))}
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ width: '95%', alignSelf: 'center' }} />
        <DiscActionsButtons
          disableDiscAction={!selectedCurrentPlayerId}
          disableUndo={events.length == 0}
          onDiscActionClick={handleDiscAction}
          onUndoClick={handleUndoLast}
        />
        <LastEventAccordion
          {...{ events, players: gameTeamData.initialPlayers.left.concat(gameTeamData.initialPlayers.right) }}
        />
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
          <Button
            variant="solid"
            size="lg"
            color="success"
            fullWidth
            disabled={!selectedCurrentPlayerId}
            loading={saveFrom == 'SCORE'}
            onClick={(e) => confirmScore(e, 'SCORE')}
          >
            WE scored
          </Button>
          <Button
            variant="solid"
            size="lg"
            color="danger"
            fullWidth
            loading={saveFrom == 'VS_SCORE'}
            onClick={(e) => confirmScore(e, 'VS_SCORE')}
          >
            THEY scored
          </Button>
        </Stack>
        <BottomDialog
          open={modalsOpen.confirmScore}
          onClose={handleConfirmScoreClose}
          content={
            <>
              <Typography id="nested-modal-title" level="h2">
                Are you sure that {saveFrom == 'SCORE' ? 'WE' : 'THEY'} just scored?
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row-reverse' } }}>
                <Button variant="solid" color="primary" onClick={() => handleScore(saveFrom as 'SCORE' | 'VS_SCORE')}>
                  Save {saveFrom == 'SCORE' ? 'our' : 'their'} point
                </Button>
                <Button variant="outlined" color="neutral" onClick={handleConfirmScoreClose}>
                  Cancel
                </Button>
              </Box>
            </>
          }
        />
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
          <Button
            variant="soft"
            size="lg"
            color="neutral"
            fullWidth
            loading={saveFrom == 'HALFTIME'}
            onClick={(e) => {
              setSaveFrom('HALFTIME');
              handleEndHalfButtonClick(e, gameTeamData.game.id, router, setCurrentPointInfo);
            }}
          >
            {gameTeamData.game.halftimeAt ? 'End game' : 'Halftime'}
          </Button>
          <Button variant="soft" size="lg" color="primary" fullWidth onClick={() => updateModals('nextLine', true)}>
            Next line ({selectedNextPlayersL.length + selectedNextPlayersR.length}/7)
          </Button>
          <SelectLineModal
            type="nextLine"
            open={modalsOpen.nextLine}
            onClose={() => updateModals('nextLine', false)}
            InfoSection={
              <Stack direction="row" sx={{ justifyContent: 'space-between', width: '95%' }}>
                <Typography level="h4">Select NEXT line:</Typography>
                <Stack direction="row" spacing={1}>
                  {nextPointInfo.genderRatio && (
                    <Chip
                      variant="soft"
                      color={nextPointInfo.genderRatio[0] == 'F' ? 'primary' : 'warning'}
                      size="lg"
                      sx={{ justifyContent: 'center' }}
                    >
                      {nextPointInfo.genderRatio}
                    </Chip>
                  )}
                  <Chip variant="soft" size="lg" sx={{ justifyContent: 'center' }}>
                    {nextPointInfo.fieldSide}
                  </Chip>
                </Stack>
              </Stack>
            }
            teamWithGroups={gameTeamData.teamWithGroups}
            lastLinePlayerIds={gameTeamData.lastLinePlayerIds}
            onSaveLineClick={handleNextLineSave}
            splitPlayers={{
              left: {
                players: gameTeamData.players.left,
                selected: selectedNextPlayersL,
                limit: nextPointInfo.playerLimitL,
              },
              right: {
                players: gameTeamData.players.right,
                selected: selectedNextPlayersR,
                limit: nextPointInfo.playerLimitR,
              },
            }}
          />
        </Stack>
        <Accordion sx={{ width: '95%' }}>
          <AccordionSummary sx={{ justifyContent: 'space-between' }}>More:</AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%', mt: 1 }}>
              {[
                { type: 'TIMEOUT', label: 'OUR', color: 'primary', source: timeouts.ourTimeouts },
                { type: 'VS_TIMEOUT', label: 'THEIR', color: 'warning', source: timeouts.vsTimeouts },
              ].map(({ type, label, color, source }) => {
                const currentHalf = gameTeamData.game.halftimeAt ? 'secondHalf' : 'firstHalf';
                const timeoutsLeft = source[currentHalf];

                return (
                  <Button
                    key={type}
                    variant="soft"
                    size="lg"
                    color={color as 'primary' | 'warning'}
                    fullWidth
                    disabled={timeoutsLeft === 0}
                    onClick={() => handleTimeout(type == 'TIMEOUT')}
                  >
                    {`${label} TIMEOUT (${timeoutsLeft}/${timeouts.perHalf} this half)`}
                  </Button>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%', mt: 1 }}>
              <Button
                variant="outlined"
                size="lg"
                color="success"
                fullWidth
                startDecorator={<Edit />}
                onClick={() => updateModals('editLine', true)}
              >
                Edit line
              </Button>
              <SelectLineModal
                type="editLine"
                open={modalsOpen.editLine}
                onClose={() => updateModals('editLine', false)}
                InfoSection={
                  <>
                    <PointCard {...currentPointInfo} />
                    <Typography level="title-sm" sx={{ mb: 2 }}>
                      EDIT players for the CURRENT line:
                    </Typography>
                  </>
                }
                teamWithGroups={gameTeamData.teamWithGroups}
                lastLinePlayerIds={gameTeamData.lastLinePlayerIds}
                onSaveLineClick={handleEditLineSave}
                splitPlayers={{
                  left: {
                    players: gameTeamData.players.left,
                    selected: currentPlayersIdsL,
                    limit: gameTeamData.initialPlayers.left.length,
                  },
                  right: {
                    players: gameTeamData.players.right,
                    selected: currentPlayersIdsR,
                    limit: gameTeamData.initialPlayers.right.length,
                  },
                }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    )
  );
}
