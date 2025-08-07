import { Badge, Button } from '@mui/joy';
import DirectionsRunOutlined from '@mui/icons-material/DirectionsRunOutlined';
import FrontHandOutlined from '@mui/icons-material/FrontHandOutlined';

export default function PlayerButton({
  firstName,
  nickname,
  isHandler,
  isFMP,
  variant,
  disabled,
  lineCount,
  onClick,
}: {
  firstName: string;
  nickname: string | null;
  isHandler: boolean;
  isFMP: boolean;
  variant: 'plain' | 'outlined' | 'soft' | 'solid';
  disabled?: boolean;
  lineCount?: number;
  onClick: () => void;
}) {
  const name = nickname ?? firstName;
  const roleIcon = isHandler ? <FrontHandOutlined /> : <DirectionsRunOutlined />;
  const colour = isFMP ? 'primary' : 'success';

  return (
    <Badge
      size="md"
      color="neutral"
      variant="solid"
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      badgeInset="1.5%"
      invisible={!lineCount}
      badgeContent={lineCount}
      sx={{ width: '90%' }}
    >
      <Button
        size="lg"
        fullWidth
        variant={variant}
        disabled={disabled}
        endDecorator={roleIcon}
        color={colour}
        onClick={onClick}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        {name}
      </Button>
    </Badge>
  );
}
