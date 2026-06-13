import { describe, expect, it } from 'vitest';
import type { Player, Point } from '@/database/schema';
import { playersWithLineCounts, playersWithLiveCounts } from '@/lib/playerCounts';

const teamId = 'team-1';
const groupId = 'group-a';

function mkPlayer(id: string): Player {
  return {
    id,
    firstName: id,
    lastName: null,
    isFMP: false,
    isPR: false,
    type: 'Cutter',
    nickname: null,
    order: null,
    teamId,
    teamGroupId: groupId,
  };
}

function mkPoint(id: string, playerIds: string[]): Point {
  return {
    id,
    gameId: 'game-1',
    playerIds,
    isActive: false,
    createdAt: id,
  };
}

describe('playersWithLineCounts', () => {
  it('uses newest-first points for sit counts', () => {
    const players = [mkPlayer('on'), mkPlayer('bench')];
    const points = [
      mkPoint('p2', ['on', 'a', 'b', 'c', 'd', 'e', 'f']),
      mkPoint('p1', ['on', 'a', 'b', 'c', 'd', 'e', 'f']),
      mkPoint('p0', ['on', 'a', 'b', 'c', 'd', 'e', 'f']),
    ];
    const [onPlayer, benchPlayer] = playersWithLineCounts(players, points);
    expect(onPlayer.lineCount).toBe(3);
    expect(onPlayer.sitCount).toBe(0);
    expect(benchPlayer.lineCount).toBe(0);
    expect(benchPlayer.sitCount).toBe(3);
  });
});

describe('playersWithLiveCounts', () => {
  const completed = [
    mkPoint('p1', ['starter', 'a', 'b', 'c', 'd', 'e', 'f']),
    mkPoint('p0', ['starter', 'a', 'b', 'c', 'd', 'e', 'f']),
  ];

  it('credits current-point roster with a line and zero sit', () => {
    const players = [mkPlayer('starter'), mkPlayer('sub'), mkPlayer('bench')];
    const withLive = playersWithLiveCounts(players, completed, {
      playerIds: ['starter', 'a', 'b', 'c', 'd', 'e', 'f', 'sub'],
    });
    const byId = Object.fromEntries(withLive.map((p) => [p.id, p]));
    expect(byId.starter.lineCount).toBe(3);
    expect(byId.starter.sitCount).toBe(0);
    expect(byId.sub.lineCount).toBe(1);
    expect(byId.sub.sitCount).toBe(0);
    expect(byId.bench.lineCount).toBe(0);
    expect(byId.bench.sitCount).toBe(3);
  });

  it('increments sit for players not rostered on the in-progress point', () => {
    const players = [mkPlayer('bench')];
    const [benchPlayer] = playersWithLiveCounts(players, completed, {
      playerIds: ['starter', 'a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(benchPlayer.lineCount).toBe(0);
    expect(benchPlayer.sitCount).toBe(3);
  });
});
