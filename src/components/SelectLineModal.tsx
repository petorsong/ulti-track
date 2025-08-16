import { type ReactNode } from 'react';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import Group from '@mui/icons-material/Group';
import { Box, Button, Divider, Stack, Typography } from '@mui/joy';
import { TeamGroup, type Player } from '@/database/schema';
import { colStackStyles } from '@/utils';
import PlayerButton from './PlayerButton';

type SplitPlayersListProps = {
  players: Player[];
  selected: string[];
  limit: number;
  selectFunc: (p: string[]) => void;
};

export default function SelectLineModal({
  InfoSection,
  teamGroups,
  onClearLineClick,
  onSaveLineClick,
  splitPlayers,
}: {
  InfoSection: ReactNode;
  teamGroups: TeamGroup[];
  onClearLineClick: () => void;
  onSaveLineClick: () => void;
  splitPlayers: { left: SplitPlayersListProps; right: SplitPlayersListProps };
}) {
  return (
    <Stack direction="column" spacing={1} sx={{ overflow: 'scroll', ...colStackStyles }}>
      {InfoSection}
      <Divider />
      {teamGroups.map((teamGroup) => (
        <Box key={teamGroup.id} sx={{ width: '100%' }}>
          <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
            {teamGroup.name}
          </Typography>
          <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
            {[splitPlayers.left, splitPlayers.right].map((split, i) => (
              <Stack key={`playerList${i}`} direction="column" spacing={1} sx={colStackStyles}>
                {split.players
                  .filter((player) => player.teamGroupId == teamGroup.id)
                  .map((player) => {
                    const playerSelected = split.selected.includes(player.id);
                    return (
                      <PlayerButton
                        key={player.id}
                        variant={playerSelected ? 'solid' : 'soft'}
                        disabled={split.selected.length >= split.limit && !playerSelected}
                        onClick={() =>
                          split.selectFunc(
                            playerSelected
                              ? split.selected.filter((p) => p != player.id)
                              : split.selected.concat(player.id)
                          )
                        }
                        {...player}
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
          disabled={splitPlayers.left.selected.length + splitPlayers.right.selected.length == 0}
          onClick={onClearLineClick}
        >
          Clear line
        </Button>
        <Button
          variant="soft"
          color="neutral"
          sx={{ width: '47.5%' }}
          startDecorator={<Save />}
          onClick={onSaveLineClick}
        >
          Save line ({splitPlayers.left.selected.length + splitPlayers.right.selected.length}/7)
        </Button>
      </Stack>
    </Stack>
  );
}
