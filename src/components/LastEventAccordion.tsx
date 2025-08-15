import { Accordion, AccordionDetails, AccordionSummary, Box, Chip } from '@mui/joy';
import type { EventType, InsertPointEvent, Player } from '@/database/schema';

export default function LastEventAccordion({ events, players }: { events: InsertPointEvent[]; players: Player[] }) {
  function EventChip({
    index,
    type,
    playerOneId,
    playerTwoId,
  }: {
    index: number;
    type: EventType;
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
      case 'BLOCK':
      case 'TA':
      case 'DROP':
        return (
          <Chip color={type == 'BLOCK' ? 'success' : 'danger'}>
            {index}. {playerOneName} {type}
          </Chip>
        );
      case 'TIMEOUT':
      case 'VS_TIMEOUT':
        return (
          <Chip color={type == 'TIMEOUT' ? 'primary' : 'warning'}>
            {index}. {type == 'TIMEOUT' ? 'TIMEOUT (US)' : 'TIMEOUT (THEM)'}
          </Chip>
        );
      case 'SUBSTITUTION': // TODO: eventTypes completion
      default:
        return <Chip>N/A</Chip>;
    }
  }

  const reversedEvents = events.toReversed();
  const lastEvent = reversedEvents[0];

  return (
    <Accordion sx={{ width: '95%' }}>
      <AccordionSummary sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ alignItems: 'flex-start' }}>
          Last: <EventChip {...lastEvent} index={reversedEvents.length} />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {reversedEvents.slice(1).map((e, i) => (
            <EventChip {...e} index={reversedEvents.length - (i + 1)} key={i} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
