import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Group from '@mui/icons-material/Group';
import GroupRemove from '@mui/icons-material/GroupRemove';
import PlayCircleFilledOutlined from '@mui/icons-material/PlayCircleFilledOutlined';
import { Box, Button, Stack, Typography } from '@mui/joy';
import { PlayerButton, PointCard, UndoButton } from '@/components';
import { useDraftGame } from '@/hooks/useDraftGame';
import { getUndoLabel } from '@/lib/draftGame';
import { draftPlayerColumns, draftPointInfo, draftTeamWithGroups } from '@/lib/liveGameData';
import { COL_STACK_STYLES, isMixedLinePlayerDisabled } from '@/utils';

export default function LiveLineupPage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const { isHydrated, draft, dispatch, undo, lastAction, canUndo } = useDraftGame(teamId);

  useEffect(() => {
    if (!router.isReady || !isHydrated) {
      return;
    }
    if (!draft) {
      router.replace(`/teams/${teamId}`);
      return;
    }
    if (draft.phase === 'point') {
      router.replace(`/teams/${teamId}/live/point`);
    } else if (draft.phase === 'complete') {
      router.replace(`/teams/${teamId}/live/complete`);
    }
  }, [router, teamId, isHydrated, draft]);

  if (!isHydrated || !draft) {
    return null;
  }

  const pointInfo = draftPointInfo(draft);
  const { playersL, playersR } = draftPlayerColumns(draft);
  const teamWithGroups = draftTeamWithGroups(draft);
  const { left: selectedPlayersL, right: selectedPlayersR } = draft.lineupSelection;
  const selectedCount = selectedPlayersL.length + selectedPlayersR.length;
  const selectingAfterScore = draft.completedPoints.length > 0 && selectedCount < 7;
  const undoLabel = lastAction
    ? getUndoLabel(lastAction, draft.rosterSnapshot.players, { variant: 'button' })
    : 'Undo';
  const undoAria = lastAction
    ? getUndoLabel(lastAction, draft.rosterSnapshot.players, { variant: 'aria' })
    : undefined;

  const setSelection = (left: string[], right: string[]) => {
    dispatch({ type: 'SET_LINEUP_SELECTION', selection: { left, right } });
  };

  const handleHalftimeOrEnd = () => {
    if (draft.halftimeAt != null) {
      dispatch({ type: 'END_GAME' });
      router.push(`/teams/${teamId}/live/complete`);
    } else {
      dispatch({ type: 'HALFTIME' });
    }
  };

  const handleStartPoint = () => {
    const playerIds = selectedPlayersL.concat(selectedPlayersR);
    dispatch({ type: 'START_POINT', playerIds });
    router.push(`/teams/${teamId}/live/point`);
  };

  const handleUndo = () => {
    const undone = undo();
    if (undone?.type === 'END_POINT') {
      router.push(`/teams/${teamId}/live/point`);
    }
  };

  const enforceAbba = draft.setup.enforceAbba ?? true;

  return (
    <Stack direction="column" spacing={1} sx={{ ...COL_STACK_STYLES, mt: 1 }}>
      <PointCard {...pointInfo} />
      <Typography level="title-sm" sx={{ mb: 2 }}>
        Select players for the CURRENT line:
      </Typography>
      {teamWithGroups.teamGroups.map((teamGroup) => (
        <Box key={teamGroup.id} sx={{ width: '100%' }}>
          <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
            {teamGroup.name}
          </Typography>
          <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
            {[
              { list: playersL, selected: selectedPlayersL, isLeft: true },
              { list: playersR, selected: selectedPlayersR, isLeft: false },
            ].map(({ list, selected, isLeft }, i) => {
              const abbaColumnLimit = isLeft ? pointInfo.playerLimitL : pointInfo.playerLimitR;
              const colour = isLeft ? 'primary' : 'success';
              return (
                <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                  {list
                    .filter((player) => player.teamGroupId === teamGroup.id)
                    .map((player) => {
                      const playerSelected = selected.includes(player.id);
                      const lineCount = playerSelected ? player.lineCount + 1 : player.lineCount;
                      const disabled =
                        teamWithGroups.type === 'Mixed'
                          ? isMixedLinePlayerDisabled(
                              isLeft,
                              selectedPlayersL,
                              selectedPlayersR,
                              enforceAbba,
                              abbaColumnLimit,
                              playerSelected
                            )
                          : selectedPlayersL.length + selectedPlayersR.length >= 7 && !playerSelected;
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'soft'}
                          disabled={disabled}
                          onClick={() => {
                            const nextSelected = playerSelected
                              ? selected.filter((id) => id !== player.id)
                              : selected.concat(player.id);
                            if (isLeft) {
                              setSelection(nextSelected, selectedPlayersR);
                            } else {
                              setSelection(selectedPlayersL, nextSelected);
                            }
                          }}
                          {...{ ...player, colour, lineCount }}
                        />
                      );
                    })}
                </Stack>
              );
            })}
          </Stack>
        </Box>
      ))}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <UndoButton
          canUndo={canUndo}
          label={undoLabel}
          ariaLabel={undoAria}
          onUndo={handleUndo}
          variant="outlined"
          color="warning"
        />
        <Button
          variant="outlined"
          fullWidth
          endDecorator={<GroupRemove />}
          disabled={selectedCount === 0}
          onClick={() => dispatch({ type: 'CLEAR_LINE' })}
        >
          Clear Line
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Button variant="soft" color="neutral" fullWidth onClick={handleHalftimeOrEnd}>
          {draft.halftimeAt != null ? 'End Game' : 'Halftime'}
        </Button>
        <Button
          fullWidth
          endDecorator={<PlayCircleFilledOutlined />}
          disabled={selectedCount < 7}
          onClick={handleStartPoint}
        >
          {selectingAfterScore ? `Start Point (${selectedCount}/7)` : 'Start Point'}
        </Button>
      </Stack>
    </Stack>
  );
}
