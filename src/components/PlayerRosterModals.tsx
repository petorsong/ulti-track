import { type ReactNode, useEffect, useState } from 'react';
import DirectionsRunOutlined from '@mui/icons-material/DirectionsRunOutlined';
import FrontHandOutlined from '@mui/icons-material/FrontHandOutlined';
import MultipleStopRounded from '@mui/icons-material/MultipleStopRounded';
import { Box, Button, FormControl, FormLabel, Input, Stack, Switch, Typography } from '@mui/joy';
import { PlayerTypePG, type PlayerType, type TeamType } from '@/database/schema';
import BottomDialog from './BottomDialog';

const playerTypeIcons: Record<PlayerType, ReactNode> = {
  Handler: <FrontHandOutlined />,
  Cutter: <DirectionsRunOutlined />,
  Hybrid: <MultipleStopRounded />,
};

function PlayerTypePicker({
  value,
  onChange,
}: {
  value: PlayerType;
  onChange: (type: PlayerType) => void;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {PlayerTypePG.map((type) => (
        <Button
          key={type}
          variant={value === type ? 'solid' : 'outlined'}
          color="primary"
          startDecorator={playerTypeIcons[type]}
          onClick={() => onChange(type)}
        >
          {type}
        </Button>
      ))}
    </Box>
  );
}

export function AddPlayerModal({
  open,
  onClose,
  teamType,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  teamType: TeamType;
  onSave: (data: { firstName: string; type: PlayerType; isFMP: boolean }) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [type, setType] = useState<PlayerType>('Cutter');
  const [isFMP, setIsFMP] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName('');
      setType('Cutter');
      setIsFMP(false);
    }
  }, [open]);

  const handleSave = () => {
    if (!firstName.trim()) {
      return;
    }
    onSave({ firstName: firstName.trim(), type, isFMP });
    onClose();
  };

  return (
    <BottomDialog
      open={open}
      onClose={onClose}
      content={
        <>
          <Typography id="nested-modal-title" level="h2">
            Add player
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="Player name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </FormControl>
            <FormControl>
              <FormLabel>Player type</FormLabel>
              <PlayerTypePicker value={type} onChange={setType} />
            </FormControl>
            {teamType === 'Mixed' && (
              <FormControl orientation="horizontal">
                <FormLabel>Gender</FormLabel>
                <Switch
                  size="lg"
                  checked={!isFMP}
                  onChange={(e) => setIsFMP(!e.target.checked)}
                  startDecorator="F"
                  endDecorator="O"
                />
              </FormControl>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row-reverse' } }}>
              <Button color="primary" disabled={!firstName.trim()} onClick={handleSave}>
                Add
              </Button>
              <Button variant="outlined" color="neutral" onClick={onClose}>
                Cancel
              </Button>
            </Box>
          </Stack>
        </>
      }
    />
  );
}

export function EditPlayerTypeModal({
  open,
  onClose,
  selectionLabel,
  initialType,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  selectionLabel: string;
  initialType: PlayerType;
  onSave: (type: PlayerType) => void;
}) {
  const [type, setType] = useState<PlayerType>(initialType);

  useEffect(() => {
    if (open) {
      setType(initialType);
    }
  }, [open, initialType]);

  return (
    <BottomDialog
      open={open}
      onClose={onClose}
      content={
        <>
          <Typography id="nested-modal-title" level="h2">
            Edit type: {selectionLabel}
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl>
              <FormLabel>Player type</FormLabel>
              <PlayerTypePicker value={type} onChange={setType} />
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row-reverse' } }}>
              <Button color="primary" onClick={() => onSave(type)}>
                Save
              </Button>
              <Button variant="outlined" color="neutral" onClick={onClose}>
                Cancel
              </Button>
            </Box>
          </Stack>
        </>
      }
    />
  );
}
