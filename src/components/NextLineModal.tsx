import { colStackStyles } from '@/utils';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import Group from '@mui/icons-material/Group';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/joy';
import { TeamGroup, type Player } from '@/database/schema';
import PlayerButton from './PlayerButton';

export default function NextLineModal({
  onClearLineClick,
  onSaveLineClick,
  nextPointInfo,
  selectedNextPlayersL,
  selectedNextPlayersR,
  nextPlayersL,
  nextPlayersR,
  setSelectedNextPlayersL,
  setSelectedNextPlayersR,
  teamGroups,
}: {
  onClearLineClick: () => void;
  onSaveLineClick: () => void;
  nextPointInfo: {
    genderRatio: string;
    fieldSide: string;
    playerLimitL: number;
    playerLimitR: number;
  };
  selectedNextPlayersL: string[];
  selectedNextPlayersR: string[];
  nextPlayersL: Player[];
  nextPlayersR: Player[];
  setSelectedNextPlayersL: (p: string[]) => void;
  setSelectedNextPlayersR: (p: string[]) => void;
  teamGroups: TeamGroup[];
}) {
  return (
    <Stack direction="column" spacing={1} sx={{ overflow: 'scroll', ...colStackStyles }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Typography level="h4">Select NEXT line:</Typography>
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
      </Stack>
      <Divider />
      {teamGroups.map((teamGroup) => (
        <Box key={teamGroup.id} sx={{ width: '100%' }}>
          <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
            {teamGroup.name}
          </Typography>
          <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
            {[nextPlayersL, nextPlayersR].map((playerList, i) => (
              <Stack key={`playerList${i}`} direction="column" spacing={1} sx={colStackStyles}>
                {playerList
                  .filter((player) => player.teamGroupId == teamGroup.id)
                  .map((player) => {
                    const selectedList = i == 0 ? selectedNextPlayersL : selectedNextPlayersR;
                    const playerLimit = i == 0 ? nextPointInfo.playerLimitL : nextPointInfo.playerLimitR;
                    const selectFunc = i == 0 ? setSelectedNextPlayersL : setSelectedNextPlayersR;
                    const playerSelected = selectedList.includes(player.id);
                    return (
                      <PlayerButton
                        key={player.id}
                        variant={playerSelected ? 'solid' : 'soft'}
                        disabled={selectedList.length >= playerLimit && !playerSelected}
                        onClick={() => {
                          selectFunc(
                            playerSelected ? selectedList.filter((p) => p != player.id) : selectedList.concat(player.id)
                          );
                        }}
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
          disabled={selectedNextPlayersL.length + selectedNextPlayersR.length == 0}
          onClick={onClearLineClick}
        >
          Clear Line
        </Button>
        <Button
          variant="soft"
          color="neutral"
          sx={{ width: '47.5%' }}
          startDecorator={<Save />}
          onClick={onSaveLineClick}
        >
          Save line ({selectedNextPlayersL.length + selectedNextPlayersR.length}/7)
        </Button>
      </Stack>
    </Stack>
  );
}
