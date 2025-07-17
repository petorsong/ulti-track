import { Button } from '@mui/joy';
import FrontHandOutlinedIcon from '@mui/icons-material/FrontHandOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';

export default function PlayerButton({
  firstName,
  nickname,
  isHandler,
  isFemaleMatching,
  variant,
  disabled,
  onClick,
}: {
  firstName: string;
  nickname: string | null;
  isHandler: boolean;
  isFemaleMatching: boolean;
  variant: 'plain' | 'outlined' | 'soft' | 'solid';
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void; // TODO: maybe don't need event at all
}) {
  const name = nickname ?? firstName;
  const roleIcon = isHandler
    ? <FrontHandOutlinedIcon />
    : <DirectionsRunOutlinedIcon />;
  const colour = isFemaleMatching ? 'primary' : 'success';

  return (
    <Button
      onClick={onClick}
      size="lg"
      variant={variant}
      disabled={disabled}
      endDecorator={roleIcon}
      color={colour}
      sx={{
        justifyContent: "space-between",
        width: '90%'
      }}
    >
      {name}
    </Button>
  );
}
