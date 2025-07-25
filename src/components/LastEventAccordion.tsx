import { Accordion, AccordionDetails, AccordionSummary, Box, Chip } from '@mui/joy';
import { EventTypeTS, players as playersDb, pointEvents } from '@/database/schema';

export default function LastEventAccordion({
  events,
  players,
}: {
  events: (typeof pointEvents.$inferInsert)[];
  players: (typeof playersDb.$inferSelect)[];
}) {
  function EventChip({
    index,
    type,
    playerOneId,
    playerTwoId,
  }: {
    index: number;
    type: EventTypeTS;
    playerOneId?: string | null;
    playerTwoId?: string | null;
  }) {
    const playerMap = new Map(players.map((p) => [p.id, p.nickname ?? p.firstName]));
    const playerOneName = playerMap.get(playerOneId!);
    const playerTwoName = playerMap.get(playerTwoId!);
    switch (type) {
      case 'PASS':
        return (
          <Chip>
            {index}. {playerOneName} ➡️ {playerTwoName}
          </Chip>
        );
      case 'D':
      case 'TA':
      case 'DROP':
        return (
          <Chip color={type == 'D' ? 'success' : 'danger'}>
            {index}. {playerOneName} {type}
          </Chip>
        );
      case 'SUBSTITUTION': // TODO: eventTypes completion
      case 'TIMEOUT': // TODO: timeout completion
      case 'VS_TIMEOUT':
      default:
        return <Chip>N/A</Chip>;
    }
  }

  const reversedEvents = events.toReversed();
  const lastEvent = reversedEvents[0];

  return (
    <Accordion sx={{ width: '95%' }}>
      <AccordionSummary sx={{ justifyContent: 'space-between' }}>
        {
          <Box sx={{ alignItems: 'flex-start' }}>
            Last: <EventChip {...lastEvent} index={reversedEvents.length} />
          </Box>
        }
      </AccordionSummary>
      <AccordionDetails>
        {
          <Box sx={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {reversedEvents.slice(1).map((e, i) => (
              <EventChip {...e} index={reversedEvents.length - (i + 1)} key={i} />
            ))}
          </Box>
        }
      </AccordionDetails>
    </Accordion>
  );
}
