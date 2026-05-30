import { describe, expect, it } from 'vitest';
import type { InsertPointEvent } from '@/database/schema';
import { normalizeScoreAssists } from './normalizeScoreAssists';

function passEvent(id: string, pointId: string): InsertPointEvent {
  return { id, pointId, type: 'PASS', playerOneId: 'p1', playerTwoId: 'p2' };
}

function scoreEvent(pointId: string): InsertPointEvent {
  return { id: 'score', pointId, type: 'SCORE', playerOneId: 'p1' };
}

describe('normalizeScoreAssists', () => {
  it('tags assist and hockey assist on passes before a score', () => {
    const pointId = 'pt-1';
    const events = [
      passEvent('p1', pointId),
      passEvent('p2', pointId),
      scoreEvent(pointId),
    ];
    const normalized = normalizeScoreAssists(events);
    expect(normalized[0].eventJson?.assistType).toBe('HOCKEY_ASSIST');
    expect(normalized[1].eventJson?.assistType).toBe('ASSIST');
    expect(events[0].eventJson).toBeUndefined();
  });

  it('does not mutate the input array events', () => {
    const events = [passEvent('p1', 'pt'), scoreEvent('pt')];
    normalizeScoreAssists(events);
    expect(events[0].eventJson).toBeUndefined();
  });
});
