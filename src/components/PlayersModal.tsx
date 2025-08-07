import { colStackStyles } from '@/utils';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Save from '@mui/icons-material/Save';
import { Button, Chip, Divider, Stack, Typography } from '@mui/joy';
import PlayerButton from './PlayerButton';
import { players } from '@/database/schema';

export default function PointCard({
  onClearLineClick,
  onSaveLineClick,
  nextPointInfo,
  selectedNextPlayersL,
  selectedNextPlayersR,
  nextPlayersL,
  nextPlayersR,
  setSelectedNextPlayersL,
  setSelectedNextPlayersR,
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
  nextPlayersL: (typeof players.$inferSelect)[];
  nextPlayersR: (typeof players.$inferSelect)[];
  setSelectedNextPlayersL: (p: string[]) => void;
  setSelectedNextPlayersR: (p: string[]) => void;
}) {
  return (
    <Stack direction="column" spacing={1} sx={{ overflow: 'scroll', ...colStackStyles }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', width: '95%' }}>
        <Typography level="h4">Next line:</Typography>
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
      <Stack direction="row" sx={{ width: '100%' }}>
        {[nextPlayersL, nextPlayersR].map((playerList, i) => (
          <Stack key={`playerList${i}`} direction="column" spacing={1} sx={colStackStyles}>
            {playerList.map((player) => {
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
