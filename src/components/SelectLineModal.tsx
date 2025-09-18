import { useState, type ReactNode } from 'react';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import Group from '@mui/icons-material/Group';
import { Box, Button, Divider, Modal, ModalClose, ModalDialog, Stack, Typography } from '@mui/joy';
import type { PlayerWithLineCount, TeamWithTeamGroups } from '@/database/schema';
import { COL_STACK_STYLES } from '@/utils';
import PlayerButton from './PlayerButton';

type SplitPlayersListProps = {
  players: PlayerWithLineCount[];
  selected: string[];
  limit: number | null;
};

export default function SelectLineModal({
  type,
  open,
  onClose,
  InfoSection,
  teamWithGroups,
  lastLinePlayerIds,
  onSaveLineClick,
  splitPlayers,
}: {
  type: 'editLine' | 'nextLine';
  open: boolean;
  onClose: () => void;
  InfoSection: ReactNode;
  teamWithGroups: TeamWithTeamGroups;
  lastLinePlayerIds: string[];
  onSaveLineClick: (players: { left: string[]; right: string[] }) => () => void;
  splitPlayers: { left: SplitPlayersListProps; right: SplitPlayersListProps };
}) {
  const [selectedPlayersL, setSelectedPlayersL] = useState(splitPlayers.left.selected);
  const [selectedPlayersR, setSelectedPlayersR] = useState(splitPlayers.right.selected);
  const selectedCount = selectedPlayersL.length + selectedPlayersR.length;

  return (
    <Modal
      open={open}
      onClose={() => {
        setSelectedPlayersL(splitPlayers.left.selected);
        setSelectedPlayersR(splitPlayers.right.selected);
        onClose();
      }}
    >
      <ModalDialog layout="fullscreen">
        <ModalClose />
        <Stack direction="column" spacing={1} sx={{ overflow: 'scroll', ...COL_STACK_STYLES }}>
          {InfoSection}
          <Divider />
          {teamWithGroups.teamGroups.map((teamGroup) => (
            <Box key={teamGroup.id} sx={{ width: '100%' }}>
              <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
                {teamGroup.name}
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                {[splitPlayers.left, splitPlayers.right].map((split, i) => {
                  const isLeftSide = i === 0;
                  const selectedPlayers = isLeftSide ? selectedPlayersL : selectedPlayersR;
                  const selectFunc = isLeftSide ? setSelectedPlayersL : setSelectedPlayersR;
                  const playerLimit =
                    teamWithGroups.type === 'Mixed'
                      ? selectedPlayers.length >= split.limit!
                      : selectedPlayersL.length + selectedPlayersR.length >= 7;
                  const colour = isLeftSide ? 'primary' : 'success';
                  return (
                    <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                      {split.players
                        .filter((player) => player.teamGroupId == teamGroup.id)
                        .map((player) => {
                          const playerSelected = selectedPlayers.includes(player.id);
                          const badgeColour = playerSelected ? colour : 'neutral';
                          const badgeVariant = lastLinePlayerIds.includes(player.id) ? 'solid' : 'outlined';
                          let lineCount = player.lineCount;
                          if (type === 'editLine') {
                            if (split.selected.includes(player.id)) {
                              if (!playerSelected) {
                                lineCount = Math.max(lineCount - 1, 0);
                              }
                            } else {
                              if (playerSelected) {
                                lineCount += 1;
                              }
                            }
                          } else if (type === 'nextLine' && playerSelected) {
                            lineCount += 1;
                          }
                          return (
                            <PlayerButton
                              key={player.id}
                              variant={playerSelected ? 'solid' : 'soft'}
                              disabled={playerLimit && !playerSelected}
                              onClick={() =>
                                selectFunc(
                                  playerSelected
                                    ? selectedPlayers.filter((p) => p != player.id)
                                    : selectedPlayers.concat(player.id)
                                )
                              }
                              {...player}
                              {...{ colour, badgeColour, badgeVariant, lineCount }}
                            />
                          );
                        })}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ))}
          <Divider />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
            <Button // TODO: consider changing this to reset for editLine
              variant="soft"
              color="warning"
              sx={{ width: '47.5%' }}
              startDecorator={<GroupRemove />}
              disabled={selectedCount == 0}
              onClick={() => {
                setSelectedPlayersL([]);
                setSelectedPlayersR([]);
              }}
            >
              Clear line
            </Button>
            <Button
              variant="solid"
              color="primary"
              sx={{ width: '47.5%' }}
              startDecorator={<Save />}
              disabled={selectedCount < 7 && (type != 'nextLine' || selectedCount != 0)}
              onClick={onSaveLineClick({ left: selectedPlayersL, right: selectedPlayersR })}
            >
              Save line ({selectedCount}/7)
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
