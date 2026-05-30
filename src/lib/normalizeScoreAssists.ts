import type { InsertPointEvent } from '@/database/schema';

/** Infer assist / hockey assist on pass events before a score (same rules as end-point handler). */
export function normalizeScoreAssists(events: InsertPointEvent[]): InsertPointEvent[] {
  const normalized = events.map((e) => ({ ...e, eventJson: e.eventJson ? { ...e.eventJson } : e.eventJson }));
  const scoreEvent = normalized[normalized.length - 1];
  if (scoreEvent?.type !== 'SCORE') {
    return normalized;
  }
  const secondLastEvent = normalized[normalized.length - 2];
  if (secondLastEvent?.type === 'PASS') {
    secondLastEvent.eventJson = { ...secondLastEvent.eventJson, assistType: 'ASSIST' };
    const thirdLastEvent = normalized[normalized.length - 3];
    if (thirdLastEvent?.type === 'PASS') {
      thirdLastEvent.eventJson = { ...thirdLastEvent.eventJson, assistType: 'HOCKEY_ASSIST' };
    }
  }
  return normalized;
}
