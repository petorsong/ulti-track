import { useState, type ReactNode } from 'react';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import Group from '@mui/icons-material/Group';
import { Box, Button, Divider, Modal, ModalClose, ModalDialog, Stack, Typography } from '@mui/joy';
import type { PlayerWithLineCount, TeamGroup } from '@/database/schema';
import { COL_STACK_STYLES } from '@/utils';
import PlayerButton from './PlayerButton';

type SplitPlayersListProps = {
  players: PlayerWithLineCount[];
  selected: string[];
  limit: number;
};

export default function SelectLineModal({
  type,
  open,
  onClose,
  InfoSection,
  teamGroups,
  onSaveLineClick,
  splitPlayers,
}: {
  type: 'editLine' | 'nextLine';
  open: boolean;
  onClose: () => void;
  InfoSection: ReactNode;
  teamGroups: TeamGroup[];
  onSaveLineClick: (players: { left: string[]; right: string[] }) => () => void;
  splitPlayers: { left: SplitPlayersListProps; right: SplitPlayersListProps };
}) {
  const [selectedPlayersL, setSelectedPlayersL] = useState(splitPlayers.left.selected);
  const [selectedPlayersR, setSelectedPlayersR] = useState(splitPlayers.right.selected);

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
          {teamGroups.map((teamGroup) => (
            <Box key={teamGroup.id} sx={{ width: '100%' }}>
              <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
                {teamGroup.name}
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                {[splitPlayers.left, splitPlayers.right].map((split, i) => (
                  <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                    {split.players
                      .filter((player) => player.teamGroupId == teamGroup.id)
                      .map((player) => {
                        const selectedPlayers = i == 0 ? selectedPlayersL : selectedPlayersR;
                        const selectFunc = i == 0 ? setSelectedPlayersL : setSelectedPlayersR;
                        const playerSelected = selectedPlayers.includes(player.id);
                        const badgeColour = playerSelected ? (player.isFMP ? 'primary' : 'success') : 'neutral';
                        let lineCount = player.lineCount;
                        if (playerSelected) {
                          lineCount += 1;
                        } else if (type === 'editLine' && split.selected.includes(player.id)) {
                          lineCount = Math.max(lineCount - 1, 0);
                        }
                        return (
                          <PlayerButton
                            key={player.id}
                            variant={playerSelected ? 'solid' : 'soft'}
                            disabled={selectedPlayers.length >= split.limit && !playerSelected}
                            onClick={() =>
                              selectFunc(
                                playerSelected
                                  ? selectedPlayers.filter((p) => p != player.id)
                                  : selectedPlayers.concat(player.id)
                              )
                            }
                            badgeColour={badgeColour}
                            {...player}
                            lineCount={lineCount}
                          />
                        );
                      })}
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
          <Divider />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
            <Button
              variant="soft"
              color="warning"
              sx={{ width: '47.5%' }}
              startDecorator={<GroupRemove />}
              disabled={selectedPlayersL.length + selectedPlayersR.length == 0}
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
              disabled={selectedPlayersL.length + selectedPlayersR.length < 7}
              onClick={onSaveLineClick({ left: selectedPlayersL, right: selectedPlayersR })}
            >
              Save line ({selectedPlayersL.length + selectedPlayersR.length}/7)
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
