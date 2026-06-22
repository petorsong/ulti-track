import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Edit from '@mui/icons-material/Edit';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/joy';
import {
  BottomDialog,
  LastEventAccordion,
  PlayerButton,
  PointCard,
  SelectLineModal,
  UndoButton,
} from '@/components';
import { useDraftGame } from '@/hooks/useDraftGame';
import { getUndoLabel } from '@/lib/draftGame';
import {
  activeLinePlayers,
  benchPlayersForSubstitution,
  draftNextPointInfo,
  draftPlayerColumns,
  draftPointInfo,
  draftTeamWithGroups,
  draftTeamWithAllGroups,
} from '@/lib/liveGameData';
import { COL_STACK_STYLES } from '@/utils';

export default function LivePointPage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const { isHydrated, draft, dispatch, undo, lastAction, canUndo } = useDraftGame(teamId);

  const [modalsOpen, setModalsOpen] = useState({
    nextLine: false,
    editLine: false,
    confirmScore: false,
    substitute: false,
  });
  const [saveFrom, setSaveFrom] = useState('');

  useEffect(() => {
    if (!router.isReady || !isHydrated) {
      return;
    }
    if (!draft) {
      router.replace(`/teams/${teamId}`);
      return;
    }
    if (draft.phase === 'lineup') {
      router.replace(`/teams/${teamId}/live`);
    } else if (draft.phase === 'complete') {
      router.replace(`/teams/${teamId}/live/complete`);
    }
  }, [router, teamId, isHydrated, draft]);

  if (!isHydrated || !draft?.currentPoint) {
    return null;
  }

  const point = draft.currentPoint;
  const currentPointInfo = draftPointInfo(draft);
  const nextPointInfo = draftNextPointInfo(draft);
  const teamWithGroups = draftTeamWithGroups(draft);
  const { playersL, playersR } = draftPlayerColumns(draft);
  const linePlayers = activeLinePlayers(draft);
  const benchPlayers = benchPlayersForSubstitution(draft);
  const allLinePlayers = linePlayers.left.concat(linePlayers.right, benchPlayers.left, benchPlayers.right);

  const { left: nextL, right: nextR } = point.nextLineSelection;
  const undoLabel = lastAction
    ? getUndoLabel(lastAction, draft.rosterSnapshot.players, { variant: 'button' })
    : 'Undo';
  const undoAria = lastAction
    ? getUndoLabel(lastAction, draft.rosterSnapshot.players, { variant: 'aria' })
    : undefined;

  const enforceAbba = draft.setup.enforceAbba ?? true;

  const updateModals = (name: 'nextLine' | 'editLine' | 'confirmScore' | 'substitute', isOpen: boolean) => {
    setModalsOpen((prev) => ({ ...prev, [name]: isOpen }));
  };

  const handlePlayerClick = (playerId: string) => {
    if (!point.selectedPlayerId) {
      dispatch({ type: 'SELECT_DISC_HOLDER', playerId });
    } else if (playerId === point.selectedPlayerId) {
      dispatch({ type: 'SELECT_DISC_HOLDER', playerId });
    } else {
      dispatch({
        type: 'LOG_EVENT',
        eventType: 'PASS',
        playerOneId: point.selectedPlayerId,
        playerTwoId: playerId,
      });
    }
  };

  const handleUndo = () => {
    const undone = undo();
    if (undone?.type === 'START_POINT') {
      router.push(`/teams/${teamId}/live`);
    }
  };

  const handleHalftimeOrEnd = () => {
    if (draft.halftimeAt != null) {
      dispatch({ type: 'END_GAME' });
      router.push(`/teams/${teamId}/live/complete`);
    } else {
      dispatch({ type: 'HALFTIME' });
    }
  };

  const handleScore = (type: 'SCORE' | 'VS_SCORE') => {
    updateModals('confirmScore', false);
    const next = dispatch({
      type: 'END_POINT',
      scoreType: type,
      ...(type === 'SCORE' ? { scorerId: point.selectedPlayerId || undefined } : {}),
    });
    setSaveFrom('');
    if (!next) {
      return;
    }
    if (next.phase === 'complete') {
      router.push(`/teams/${teamId}/live/complete`);
    } else if (next.phase === 'lineup') {
      router.push(`/teams/${teamId}/live`);
    }
  };

  const currentHalf = draft.halftimeAt ? 'secondHalf' : 'firstHalf';

  return (
    <Stack direction="column" spacing={2} sx={{ ...COL_STACK_STYLES, mt: 1 }}>
      <PointCard {...currentPointInfo} />
      <Typography level="title-sm">Track player stats for point (let em cook):</Typography>
      <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
        {[linePlayers.left, linePlayers.right].map((playerList, i) => (
          <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
            {playerList.map((player) => (
              <PlayerButton
                key={player.id}
                variant={point.selectedPlayerId === player.id ? 'solid' : 'outlined'}
                colour={i === 0 ? 'primary' : 'success'}
                onClick={() => handlePlayerClick(player.id)}
                {...player}
              />
            ))}
          </Stack>
        ))}
      </Stack>
      <Divider sx={{ width: '95%', alignSelf: 'center' }} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Button
          variant="soft"
          size="lg"
          color="danger"
          fullWidth
          disabled={!point.selectedPlayerId}
          onClick={() => dispatch({ type: 'LOG_EVENT', eventType: 'TA', playerOneId: point.selectedPlayerId })}
        >
          Throwaway
        </Button>
        <Button
          variant="soft"
          size="lg"
          color="danger"
          fullWidth
          disabled={!point.selectedPlayerId}
          onClick={() => dispatch({ type: 'LOG_EVENT', eventType: 'DROP', playerOneId: point.selectedPlayerId })}
        >
          Drop
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Button
          variant="soft"
          size="lg"
          color="success"
          fullWidth
          disabled={!point.selectedPlayerId}
          onClick={() => dispatch({ type: 'LOG_EVENT', eventType: 'BLOCK', playerOneId: point.selectedPlayerId })}
        >
          Block
        </Button>
        <UndoButton canUndo={canUndo} label={undoLabel} ariaLabel={undoAria} onUndo={handleUndo} />
      </Stack>
      <LastEventAccordion events={point.events} players={allLinePlayers} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Button
          variant="solid"
          size="lg"
          color="success"
          fullWidth
          disabled={!point.selectedPlayerId}
          loading={saveFrom === 'SCORE'}
          onClick={() => {
            setSaveFrom('SCORE');
            updateModals('confirmScore', true);
          }}
        >
          WE scored
        </Button>
        <Button
          variant="solid"
          size="lg"
          color="danger"
          fullWidth
          loading={saveFrom === 'VS_SCORE'}
          onClick={() => {
            setSaveFrom('VS_SCORE');
            updateModals('confirmScore', true);
          }}
        >
          THEY scored
        </Button>
      </Stack>
      <BottomDialog
        open={modalsOpen.confirmScore}
        onClose={() => {
          setSaveFrom('');
          updateModals('confirmScore', false);
        }}
        content={
          <>
            <Typography level="h2">Are you sure that {saveFrom === 'SCORE' ? 'WE' : 'THEY'} just scored?</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row-reverse' } }}>
              <Button variant="solid" color="primary" onClick={() => handleScore(saveFrom as 'SCORE' | 'VS_SCORE')}>
                Save {saveFrom === 'SCORE' ? 'our' : 'their'} point
              </Button>
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => {
                  setSaveFrom('');
                  updateModals('confirmScore', false);
                }}
              >
                Cancel
              </Button>
            </Box>
          </>
        }
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Button variant="soft" size="lg" color="neutral" fullWidth onClick={handleHalftimeOrEnd}>
          {draft.halftimeAt != null ? 'End game' : 'Halftime'}
        </Button>
        <Button variant="soft" size="lg" color="primary" fullWidth onClick={() => updateModals('nextLine', true)}>
          Next line ({nextL.length + nextR.length}/7)
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
                    color={nextPointInfo.genderRatio[0] === 'F' ? 'primary' : 'warning'}
                    size="lg"
                  >
                    {nextPointInfo.genderRatio}
                  </Chip>
                )}
                <Chip variant="soft" size="lg">
                  {nextPointInfo.fieldSide}
                </Chip>
              </Stack>
            </Stack>
          }
          teamWithGroups={teamWithGroups}
          onSaveLineClick={(players) => () => {
            dispatch({ type: 'SET_NEXT_LINE', selection: players });
            updateModals('nextLine', false);
          }}
          splitPlayers={{
            left: { players: playersL, selected: nextL, limit: nextPointInfo.playerLimitL },
            right: { players: playersR, selected: nextR, limit: nextPointInfo.playerLimitR },
          }}
          enforceAbba={enforceAbba}
        />
      </Stack>
      <Accordion sx={{ width: '95%' }}>
          <AccordionSummary sx={{ justifyContent: 'space-between' }}>More:</AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%', mt: 1 }}>
              {[
                { isOur: true, label: 'OUR', color: 'primary' as const },
                { isOur: false, label: 'THEIR', color: 'warning' as const },
              ].map(({ isOur, label, color }) => {
                const source = isOur ? draft.timeouts.ourTimeouts : draft.timeouts.vsTimeouts;
                const timeoutsLeft = source[currentHalf];
                return (
                  <Button
                    key={label}
                    variant="soft"
                    size="lg"
                    color={color}
                    fullWidth
                    disabled={timeoutsLeft === 0}
                    onClick={() => dispatch({ type: 'TIMEOUT', isOurTimeout: isOur })}
                  >
                    {`${label} TIMEOUT (${timeoutsLeft}/${draft.timeouts.perHalf} this half)`}
                  </Button>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%', mt: 1 }}>
              <Button
                variant="outlined"
                size="lg"
                color="primary"
                fullWidth
                startDecorator={<SwapHoriz />}
                onClick={() => updateModals('substitute', true)}
              >
                Substitute
              </Button>
              <SelectLineModal
                type="substitute"
                open={modalsOpen.substitute}
                onClose={() => updateModals('substitute', false)}
                InfoSection={<Typography level="h4">Substitute player</Typography>}
                teamWithGroups={draftTeamWithAllGroups(draft)}
                activeLine={linePlayers}
                onSubstituteClick={(playerOffId, playerOnId) => () => {
                  dispatch({ type: 'SUBSTITUTE', playerOffId, playerOnId });
                  updateModals('substitute', false);
                }}
                splitPlayers={{
                  left: { players: benchPlayers.left, selected: [], limit: null },
                  right: { players: benchPlayers.right, selected: [], limit: null },
                }}
              />
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
                teamWithGroups={teamWithGroups}
                onSaveLineClick={(players) => () => {
                  dispatch({ type: 'EDIT_LINE', playerIds: players.left.concat(players.right) });
                  updateModals('editLine', false);
                }}
                splitPlayers={{
                  left: {
                    players: playersL,
                    selected: linePlayers.left.map((p) => p.id),
                    limit: linePlayers.left.length,
                  },
                  right: {
                    players: playersR,
                    selected: linePlayers.right.map((p) => p.id),
                    limit: linePlayers.right.length,
                  },
                }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
    </Stack>
  );
}
