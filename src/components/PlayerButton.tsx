import { Badge, Button } from '@mui/joy';
import DirectionsRunOutlined from '@mui/icons-material/DirectionsRunOutlined';
import FrontHandOutlined from '@mui/icons-material/FrontHandOutlined';
import MultipleStopRounded from '@mui/icons-material/MultipleStopRounded';
import { PlayerType } from '@/database/schema';

export default function PlayerButton({
  firstName,
  nickname,
  type,
  variant,
  colour,
  disabled,
  lineCount,
  sitCount,
  onClick,
}: {
  firstName: string;
  nickname: string | null;
  type: PlayerType;
  variant: 'plain' | 'outlined' | 'soft' | 'solid';
  colour: 'primary' | 'success';
  disabled?: boolean;
  lineCount?: number;
  sitCount?: number;
  onClick: () => void;
}) {
  const name = nickname ?? firstName;
  const roleIcon =
    type == 'Handler' ? <FrontHandOutlined /> : type == 'Cutter' ? <DirectionsRunOutlined /> : <MultipleStopRounded />;

  return (
    <Badge
      size="md"
      color="neutral"
      variant="outlined"
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      badgeInset="1.5%"
      invisible={!lineCount}
      badgeContent={lineCount}
      sx={{ width: '90%' }}
    >
      <Badge
        size="md"
        color="warning"
        variant="outlined"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        badgeInset="1.5%"
        invisible={!sitCount}
        badgeContent={sitCount}
        sx={{ width: '100%' }}
      >
        <Button
          size="lg"
          fullWidth
          endDecorator={roleIcon}
          {...{ variant, disabled, color: colour, onClick }}
          sx={{ justifyContent: 'space-between' }}
        >
          {name}
        </Button>
      </Badge>
    </Badge>
  );
}
