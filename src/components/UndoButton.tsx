import Undo from '@mui/icons-material/Undo';
import { Button } from '@mui/joy';
import type { ButtonProps } from '@mui/joy/Button';

/** Joy UI `Button` colors: `primary` | `neutral` | `danger` | `success` | `warning` */
export type UndoButtonColor = NonNullable<ButtonProps['color']>;

/** Joy UI `Button` variants: `solid` | `soft` | `outlined` | `plain` */
export type UndoButtonVariant = NonNullable<ButtonProps['variant']>;

export default function UndoButton({
  canUndo,
  label,
  ariaLabel,
  onUndo,
  fullWidth = true,
  variant = 'soft',
  color = 'neutral',
}: {
  canUndo: boolean;
  label: string;
  ariaLabel?: string;
  onUndo: () => void;
  fullWidth?: boolean;
  variant?: UndoButtonVariant;
  color?: UndoButtonColor;
}) {
  return (
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      endDecorator={<Undo />}
      disabled={!canUndo}
      onClick={onUndo}
      aria-label={ariaLabel ?? label}
      sx={canUndo ? { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } : undefined}
    >
      {label}
    </Button>
  );
}
