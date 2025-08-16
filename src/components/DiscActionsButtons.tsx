import Undo from '@mui/icons-material/Undo';
import { Button, Stack } from '@mui/joy';
import { type EventType } from '@/database/schema';

export default function DiscActionsButtons({
  disableDiscAction,
  disableUndo,
  onDiscActionClick,
  onUndoClick,
}: {
  disableDiscAction: boolean;
  disableUndo: boolean;
  onDiscActionClick: (event: EventType) => void;
  onUndoClick: () => void;
}) {
  return [
    <Stack key="TA_DROP" direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
      <Button
        variant="soft"
        size="lg"
        color="danger"
        fullWidth
        disabled={disableDiscAction}
        onClick={() => onDiscActionClick('TA')}
      >
        Throwaway
      </Button>
      <Button
        variant="soft"
        size="lg"
        color="danger"
        fullWidth
        disabled={disableDiscAction}
        onClick={() => onDiscActionClick('DROP')}
      >
        Drop
      </Button>
    </Stack>,
    <Stack key="D_UNDO" direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '95%' }}>
      <Button
        variant="soft"
        size="lg"
        color="success"
        fullWidth
        disabled={disableDiscAction}
        onClick={() => onDiscActionClick('BLOCK')}
      >
        Block
      </Button>
      <Button
        variant="soft"
        size="lg"
        color="neutral"
        fullWidth
        endDecorator={<Undo />}
        disabled={disableUndo}
        onClick={onUndoClick}
      >
        Undo last
      </Button>
    </Stack>,
  ];
}
