import { Badge, Button } from '@mui/joy';
import DirectionsRunOutlined from '@mui/icons-material/DirectionsRunOutlined';
import FrontHandOutlined from '@mui/icons-material/FrontHandOutlined';

export default function PlayerButton({
  firstName,
  nickname,
  isHandler,
  variant,
  disabled,
  lineCount,
  colour,
  badgeColour = 'neutral',
  badgeVariant = 'solid',
  onClick,
}: {
  firstName: string;
  nickname: string | null;
  isHandler: boolean;
  variant: 'plain' | 'outlined' | 'soft' | 'solid';
  disabled?: boolean;
  lineCount?: number;
  colour: 'primary' | 'success';
  badgeColour?: 'neutral' | 'primary' | 'success';
  badgeVariant?: 'solid' | 'outlined';
  onClick: () => void;
}) {
  const name = nickname ?? firstName;
  const roleIcon = isHandler ? <FrontHandOutlined /> : <DirectionsRunOutlined />;

  return (
    <Badge
      size="md"
      color={badgeColour}
      variant={badgeVariant}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      badgeInset="1.5%"
      invisible={!lineCount}
      badgeContent={lineCount}
      sx={{ width: '90%' }}
    >
      <Button
        size="lg"
        fullWidth
        endDecorator={roleIcon}
        {...{ variant, disabled, color: colour, onClick }}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        {name}
      </Button>
    </Badge>
  );
}
