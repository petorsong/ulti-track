import { games as gamesDb } from '@/database/schema';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from '@mui/joy';
import { type NextRouter } from 'next/router';

function GameRow({ game, router }: { game: typeof gamesDb.$inferSelect; router: NextRouter }) {
  const { id, vsTeamName, teamScore, vsTeamScore, halftimeAt, isComplete, createdAt } = game;

  const handleGameClick = () => {
    const path = isComplete ? `/games/${id}/summary` : `/games/${id}/`;
    router.push(path);
  };

  const chipProps = isComplete
    ? { colour: 'success' as const, label: 'Final' }
    : !halftimeAt
      ? { colour: 'neutral' as const, label: '1st' }
      : { colour: 'warning' as const, label: '2nd' };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      border="1px solid"
      borderColor="divider"
      borderRadius="sm"
      p={1}
      onClick={handleGameClick}
    >
      <Typography level="title-lg" textOverflow="ellipsis">
        {vsTeamName}
      </Typography>
      <Box display="flex" alignItems="center" width="180px" justifyContent="space-between" gap={0.5}>
        <Typography level="title-lg">
          {teamScore}-{vsTeamScore}
        </Typography>
        <Chip size="sm" color={chipProps.colour}>
          {chipProps.label}
        </Chip>
        <Typography level="body-lg" color="neutral">
          {new Date(createdAt).toLocaleDateString('en-US')}
        </Typography>
      </Box>
    </Box>
  );
}

export default function GamesList({ games, router }: { games: (typeof gamesDb.$inferSelect)[]; router: NextRouter }) {
  return (
    <Accordion sx={{ width: '95%' }}>
      <AccordionSummary>Past games</AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {games.map((g) => (
            <GameRow game={g} router={router} key={g.id} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
