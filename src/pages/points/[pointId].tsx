import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { EventType, GameType, InsertPointEventType, PlayerType, PlayerWithLineCountType } from '@/database/schema';
import { Button, Divider, Modal, ModalClose, ModalDialog, Stack, Typography } from '@mui/joy';
import { DiscActionsButtons, LastEventAccordion, PlayerButton, PlayersModal, PointCard } from '@/components';
import { calculatePointInfo, colStackStyles, handleEndHalfButtonClick, splitPlayersByGenderMatch } from '@/utils';

export default function PointPage() {
  const router = useRouter();
  const pointId = router.query.pointId as string;

  const [currentPlayersL, setCurrentPlayersL] = useState([] as PlayerType[]);
  const [currentPlayersR, setCurrentPlayersR] = useState([] as PlayerType[]);
  const [selectedCurrentPlayerId, setSelectedCurrentPlayerId] = useState('');
  const [events, setEvents] = useState([] as InsertPointEventType[]);
  const [nextPointInfo, setNextPointInfo] = useState({
    genderRatio: '',
    fieldSide: '',
    playerLimitL: 0,
    playerLimitR: 0,
  });
  const [halftimeAt, setHalftimeAt] = useState(null as number | null);
  const [gameId, setGameId] = useState('');
  const [nextLineModalOpen, setNextLineModalOpen] = useState(false);

  // same as [gameId] but renamed
  const [isLoading, setIsLoading] = useState(true);
  const [saveFrom, setSaveFrom] = useState('');
  const [currentPointInfo, setCurrentPointInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
    isFirstHalf: true,
  });
  const [nextPlayersL, setNextPlayersL] = useState([] as PlayerType[]);
  const [nextPlayersR, setNextPlayersR] = useState([] as PlayerType[]);
  const [selectedNextPlayersL, setSelectedNextPlayersL] = useState([] as string[]);
  const [selectedNextPlayersR, setSelectedNextPlayersR] = useState([] as string[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/points/${pointId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.gameData as GameType;
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

  const handleScoreClick = async (e: React.MouseEvent<HTMLElement>, type: EventType) => {
    e.preventDefault();
    setSaveFrom(type.toString());
    const scoreEvent = { pointId, type } as InsertPointEventType;
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
        <Stack
          direction="row"
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
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
            color="neutral"
            fullWidth
            loading={saveFrom == 'HALFTIME'}
            onClick={(e) => {
              setSaveFrom('HALFTIME');
              handleEndHalfButtonClick(e, gameId, router, setCurrentPointInfo);
            }}
          >
            {halftimeAt ? 'End Game' : 'Halftime'}
          </Button>
          <Button
            variant="soft"
            size="lg"
            color="primary"
            fullWidth
            onClick={() => {
              setNextLineModalOpen(true);
            }}
          >
            Next line ({selectedNextPlayersL.length + selectedNextPlayersR.length}/7)
          </Button>
          <Modal open={nextLineModalOpen} onClose={() => setNextLineModalOpen(false)}>
            <ModalDialog layout="fullscreen">
              <ModalClose />
              <PlayersModal
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
                }}
              />
            </ModalDialog>
          </Modal>
        </Stack>
      </Stack>
    )
  );
}
