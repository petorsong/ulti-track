import { Badge, Button } from '@mui/joy';
import { DirectionsRunOutlined, FrontHandOutlined } from '@mui/icons-material';

export default function PlayerButton({
  firstName,
  nickname,
  isHandler,
  isFemaleMatching,
  variant,
  disabled,
  lineCount,
  onClick,
}: {
  firstName: string;
  nickname: string | null;
  isHandler: boolean;
  isFemaleMatching: boolean;
  variant: 'plain' | 'outlined' | 'soft' | 'solid';
  disabled?: boolean;
  lineCount?: number;
  onClick: () => void;
}) {
  const name = nickname ?? firstName;
  const roleIcon = isHandler ? <FrontHandOutlined /> : <DirectionsRunOutlined />;
  const colour = isFemaleMatching ? 'primary' : 'success';

  return (
    <Badge
      size='sm'
      color='neutral'
      variant='solid'
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      invisible={!lineCount}
      badgeContent={lineCount}
      sx={{ width: '90%' }}
    >
      <Button
        onClick={onClick}
        size="lg"
        variant={variant}
        disabled={disabled}
        endDecorator={roleIcon}
        color={colour}
        sx={{
          justifyContent: "space-between",
        }}
        fullWidth
      >
        {name}
      </Button>
    </Badge>
  );
}
