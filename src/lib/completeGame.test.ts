import { describe, expect, it } from 'vitest';
import { collectPlayerIdsFromPayload, findMissingPlayerIds } from './completeGame';
import type { CompleteGamePayload } from '@/lib/draftGame/syncPayload';

describe('completeGame validation helpers', () => {
  it('collects player ids from payload', () => {
    const payload = {
      draftId: 'd1',
      activePlayerIds: ['a', 'b'],
      game: {} as CompleteGamePayload['game'],
      points: [
        {
          playerIds: ['a', 'c'],
          events: [{ type: 'PASS' as const, playerOneId: 'a', playerTwoId: 'd' }],
          scoreType: 'SCORE' as const,
        },
      ],
    };
    const ids = collectPlayerIdsFromPayload(payload);
    expect(ids.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('finds missing player ids', () => {
    expect(findMissingPlayerIds(['a', 'b', 'c'], ['a', 'c'])).toEqual(['b']);
  });
});
