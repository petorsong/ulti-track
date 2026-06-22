import { useEffect, useState, type ReactNode } from 'react';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Group from '@mui/icons-material/Group';
import { Box, Button, Divider, Modal, ModalClose, ModalDialog, Stack, Typography } from '@mui/joy';
import type { PlayerWithCounts, TeamWithTeamGroups } from '@/database/schema';
import { playersSameGender } from '@/lib/substitution';
import { COL_STACK_STYLES, isMixedLinePlayerDisabled } from '@/utils';
import PlayerButton from './PlayerButton';

type SplitPlayersListProps = {
  players: PlayerWithCounts[];
  selected: string[];
  limit: number | null;
};

type SplitPlayers = { left: PlayerWithCounts[]; right: PlayerWithCounts[] };

export default function SelectLineModal({
  type,
  open,
  onClose,
  InfoSection,
  teamWithGroups,
  onSaveLineClick,
  onSubstituteClick,
  activeLine,
  splitPlayers,
  enforceAbba = true,
}: {
  type: 'editLine' | 'nextLine' | 'substitute';
  open: boolean;
  onClose: () => void;
  InfoSection: ReactNode;
  teamWithGroups: TeamWithTeamGroups;
  onSaveLineClick?: (players: { left: string[]; right: string[] }) => () => void;
  onSubstituteClick?: (playerOffId: string, playerOnId: string) => () => void;
  activeLine?: SplitPlayers;
  splitPlayers: { left: SplitPlayersListProps; right: SplitPlayersListProps };
  enforceAbba?: boolean;
}) {
  const [selectedPlayersL, setSelectedPlayersL] = useState(splitPlayers.left.selected);
  const [selectedPlayersR, setSelectedPlayersR] = useState(splitPlayers.right.selected);
  const [playerOffId, setPlayerOffId] = useState('');
  const selectedCount = selectedPlayersL.length + selectedPlayersR.length;
  const selectedPlayerId = selectedPlayersL[0] ?? selectedPlayersR[0];
  const offPlayer = playerOffId
    ? activeLine?.left.concat(activeLine.right).find((p) => p.id === playerOffId)
    : undefined;

  useEffect(() => {
    if (open) {
      setSelectedPlayersL(splitPlayers.left.selected);
      setSelectedPlayersR(splitPlayers.right.selected);
      setPlayerOffId('');
    }
  }, [open, splitPlayers.left.selected, splitPlayers.right.selected]);

  const resetSelection = () => {
    setSelectedPlayersL(splitPlayers.left.selected);
    setSelectedPlayersR(splitPlayers.right.selected);
    setPlayerOffId('');
  };

  const selectOffPlayer = (isLeftSide: boolean, playerId: string, playerSelected: boolean) => {
    const nextOffId = playerSelected ? '' : playerId;
    setPlayerOffId(nextOffId);
    if (nextOffId && selectedPlayerId) {
      const onPlayer = splitPlayers.left.players
        .concat(splitPlayers.right.players)
        .find((p) => p.id === selectedPlayerId);
      const off = activeLine?.left.concat(activeLine.right).find((p) => p.id === nextOffId);
      if (onPlayer && off && !playersSameGender(teamWithGroups.type, off, onPlayer)) {
        setSelectedPlayersL([]);
        setSelectedPlayersR([]);
      }
    }
  };

  const selectPlayer = (isLeftSide: boolean, playerId: string, playerSelected: boolean) => {
    if (type === 'substitute') {
      if (playerSelected) {
        setSelectedPlayersL([]);
        setSelectedPlayersR([]);
      } else {
        setSelectedPlayersL(isLeftSide ? [playerId] : []);
        setSelectedPlayersR(isLeftSide ? [] : [playerId]);
      }
      return;
    }

    const selectFunc = isLeftSide ? setSelectedPlayersL : setSelectedPlayersR;
    const selectedPlayers = isLeftSide ? selectedPlayersL : selectedPlayersR;
    selectFunc(
      playerSelected ? selectedPlayers.filter((p) => p != playerId) : selectedPlayers.concat(playerId)
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        resetSelection();
        onClose();
      }}
    >
      <ModalDialog
        layout="fullscreen"
        sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <ModalClose />
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
          <Stack direction="column" spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
            {InfoSection}
            {type === 'substitute' && activeLine && (
              <>
                <Typography level="title-sm" sx={{ alignSelf: 'flex-start', width: '95%' }}>
                  Coming off the field:
                </Typography>
                <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                  {[activeLine.left, activeLine.right].map((players, i) => {
                    const isLeftSide = i === 0;
                    const colour = isLeftSide ? 'primary' : 'success';
                    return (
                      <Stack key={`offList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                        {players.map((player) => {
                          const playerSelected = playerOffId === player.id;
                          return (
                            <PlayerButton
                              key={player.id}
                              variant={playerSelected ? 'solid' : 'soft'}
                              colour={colour}
                              onClick={() => selectOffPlayer(isLeftSide, player.id, playerSelected)}
                              {...player}
                            />
                          );
                        })}
                      </Stack>
                    );
                  })}
                </Stack>
                <Typography level="title-sm" sx={{ alignSelf: 'flex-start', width: '95%' }}>
                  {offPlayer
                    ? `Replacement (${offPlayer.isFMP ? 'FMP' : 'open'} match):`
                    : 'Replacement:'}
                </Typography>
              </>
            )}
            <Divider sx={{ width: '95%' }} />
            {teamWithGroups.teamGroups.map((teamGroup) => (
              <Box key={teamGroup.id} sx={{ width: '100%' }}>
                <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
                  {teamGroup.name}
                </Typography>
                <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                  {[splitPlayers.left, splitPlayers.right].map((split, i) => {
                    const isLeftSide = i === 0;
                    const selectedPlayers = isLeftSide ? selectedPlayersL : selectedPlayersR;
                    const playerLimit =
                      type === 'substitute'
                        ? false
                        : teamWithGroups.type === 'Mixed' && type === 'nextLine'
                          ? (player: PlayerWithCounts, playerSelected: boolean) =>
                              isMixedLinePlayerDisabled(
                                isLeftSide,
                                selectedPlayersL,
                                selectedPlayersR,
                                enforceAbba,
                                split.limit,
                                playerSelected
                              )
                          : teamWithGroups.type === 'Mixed'
                            ? selectedPlayers.length >= split.limit!
                            : selectedPlayersL.length + selectedPlayersR.length >= 7;
                    const colour = isLeftSide ? 'primary' : 'success';
                    return (
                      <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                        {split.players
                          .filter((player) => player.teamGroupId == teamGroup.id)
                          .map((player) => {
                            const playerSelected = selectedPlayers.includes(player.id);
                            const substituteDisabled =
                              !playerOffId ||
                              (offPlayer ? !playersSameGender(teamWithGroups.type, offPlayer, player) : false) ||
                              (selectedCount === 1 && !playerSelected);
                            let lineCount = player.lineCount;
                            if (type === 'editLine') {
                              if (split.selected.includes(player.id)) {
                                if (!playerSelected) lineCount = Math.max(lineCount - 1, 0);
                              } else {
                                if (playerSelected) lineCount += 1;
                              }
                            } else if ((type === 'nextLine' || type === 'substitute') && playerSelected) lineCount += 1;
                            return (
                              <PlayerButton
                                key={player.id}
                                variant={playerSelected ? 'solid' : 'soft'}
                                disabled={
                                  type === 'substitute'
                                    ? substituteDisabled
                                    : typeof playerLimit === 'function'
                                      ? playerLimit(player, playerSelected)
                                      : playerLimit && !playerSelected
                                }
                                onClick={() => selectPlayer(isLeftSide, player.id, playerSelected)}
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
          </Stack>
        </Box>
        {type === 'substitute' ? (
          <Button
            fullWidth
            endDecorator={<SwapHoriz />}
            disabled={!playerOffId || selectedCount !== 1}
            onClick={onSubstituteClick!(playerOffId, selectedPlayerId)}
            sx={{ width: '95%', alignSelf: 'center', flexShrink: 0, pb: 'env(safe-area-inset-bottom)' }}
          >
            Confirm substitution
          </Button>
        ) : (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: 'space-between',
              width: '95%',
              alignSelf: 'center',
              flexShrink: 0,
              pb: 'env(safe-area-inset-bottom)',
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              endDecorator={<GroupRemove />}
              disabled={selectedCount === 0}
              onClick={() => {
                setSelectedPlayersL([]);
                setSelectedPlayersR([]);
              }}
            >
              Clear Line
            </Button>
            <Button
              fullWidth
              endDecorator={<Save />}
              disabled={selectedCount < 7 && (type !== 'nextLine' || selectedCount !== 0)}
              onClick={onSaveLineClick!({ left: selectedPlayersL, right: selectedPlayersR })}
            >
              Save line ({selectedCount}/7)
            </Button>
          </Stack>
        )}
      </ModalDialog>
    </Modal>
  );
}
