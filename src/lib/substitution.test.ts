import { describe, expect, it } from 'vitest';
import type { Player, TeamType } from '@/database/schema';
import { activeLinePlayerIds, canSubstitute, playersSameGender } from '@/lib/substitution';

const teamId = 'team-1';
const groupId = 'group-a';

function mkPlayer(id: string, isFMP: boolean): Player {
  return {
    id,
    firstName: id,
    lastName: null,
    isFMP,
    isPR: false,
    type: 'Cutter',
    nickname: null,
    order: null,
    teamId,
    teamGroupId: groupId,
  };
}

describe('playersSameGender', () => {
  it('requires matching isFMP on mixed teams', () => {
    const fmp = mkPlayer('f', true);
    const open = mkPlayer('o', false);
    expect(playersSameGender('Mixed', fmp, fmp)).toBe(true);
    expect(playersSameGender('Mixed', fmp, open)).toBe(false);
  });

  it('allows any pairing on single-gender teams', () => {
    const a = mkPlayer('a', false);
    const b = mkPlayer('b', true);
    for (const teamType of ['Open', 'Women'] as TeamType[]) {
      expect(playersSameGender(teamType, a, b)).toBe(true);
    }
  });
});

describe('activeLinePlayerIds', () => {
  const starting = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  it('applies substitution events to the starting line', () => {
    const ids = activeLinePlayerIds(starting, [
      { type: 'SUBSTITUTION', playerOneId: 'p2', playerTwoId: 'sub1' },
      { type: 'SUBSTITUTION', playerOneId: 'p5', playerTwoId: 'sub2' },
    ]);
    expect(ids).toEqual(['p0', 'p1', 'sub1', 'p3', 'p4', 'sub2', 'p6']);
  });

  it('keeps original starters when playerIds grows for stats', () => {
    const ids = activeLinePlayerIds(['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'sub1'], [
      { type: 'SUBSTITUTION', playerOneId: 'p2', playerTwoId: 'sub1' },
    ]);
    expect(ids).toEqual(['p0', 'p1', 'sub1', 'p3', 'p4', 'p5', 'p6']);
  });
});

describe('canSubstitute', () => {
  const roster = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'bench'].map((id) => mkPlayer(id, false));
  const starting = roster.slice(0, 7).map((p) => p.id);

  it('allows subbing a bench player of the same gender', () => {
    expect(
      canSubstitute({
        teamType: 'Open',
        roster,
        pointPlayerIds: starting,
        events: [],
        playerOffId: 'p0',
        playerOnId: 'bench',
      })
    ).toBe(true);
  });

  it('rejects bench players already on the field', () => {
    expect(
      canSubstitute({
        teamType: 'Open',
        roster,
        pointPlayerIds: starting,
        events: [],
        playerOffId: 'p0',
        playerOnId: 'p1',
      })
    ).toBe(false);
  });

  it('rejects mixed-gender substitutions', () => {
    const mixedRoster = [mkPlayer('f1', true), mkPlayer('f2', true), mkPlayer('o1', false)];
    expect(
      canSubstitute({
        teamType: 'Mixed',
        roster: mixedRoster,
        pointPlayerIds: ['f1', 'f2', 'o1'],
        events: [],
        playerOffId: 'f1',
        playerOnId: 'o1',
      })
    ).toBe(false);
  });
});
