import { describe, expect, it } from 'vitest';
import type { Game, Player } from '@/database/schema';
import { calculatePointInfo, isMixedLinePlayerDisabled, splitPlayers } from './utils';

function game(overrides: Partial<Game>): Game {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    teamId: '00000000-0000-0000-0000-000000000002',
    vsTeamName: 'Opponent',
    startOnO: false,
    startFRatio: null,
    enforceAbba: null,
    startLeft: false,
    teamScore: 0,
    vsTeamScore: 0,
    isComplete: false,
    activePlayerIds: [],
    halftimeAt: null,
    wasLastScoreUs: false,
    timeouts: {
      perHalf: 2,
      ourTimeouts: { firstHalf: 2, secondHalf: 2 },
      vsTimeouts: { firstHalf: 2, secondHalf: 2 },
    },
    startTime: null,
    clientDraftId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function player(
  overrides: Partial<Player> & Pick<Player, 'id' | 'firstName' | 'type' | 'isFMP' | 'isPR' | 'teamId' | 'teamGroupId'>
): Player {
  return {
    lastName: null,
    nickname: null,
    order: null,
    ...overrides,
  };
}

describe('calculatePointInfo', () => {
  it('returns offence when we did not score last and not at halftime flip', () => {
    const info = calculatePointInfo(game({ wasLastScoreUs: false, startOnO: false }));
    expect(info.oOrD).toBe('Offence');
  });

  it('returns defence when we scored last', () => {
    const info = calculatePointInfo(game({ wasLastScoreUs: true, teamScore: 1 }));
    expect(info.oOrD).toBe('Defence');
  });

  it('flips offence/defence at halftime point', () => {
    const info = calculatePointInfo(
      game({ teamScore: 8, vsTeamScore: 0, halftimeAt: 8, startOnO: true, wasLastScoreUs: false })
    );
    expect(info.oOrD).toBe('Defence');
  });

  it('sets mixed gender ratio at 0-0 when starting on female ratio', () => {
    const info = calculatePointInfo(game({ startFRatio: true, enforceAbba: true }));
    expect(info.genderRatio).toBe('Female 2');
    expect(info.playerLimitL).toBe(4);
    expect(info.playerLimitR).toBe(3);
  });

  it('omits gender ratio when mixed but ABBA not enforced', () => {
    const info = calculatePointInfo(game({ startFRatio: true, enforceAbba: false }));
    expect(info.genderRatio).toBeNull();
    expect(info.playerLimitL).toBeNull();
    expect(info.playerLimitR).toBeNull();
  });

  it('omits gender ratio when not a mixed game', () => {
    const info = calculatePointInfo(game({ startFRatio: null }));
    expect(info.genderRatio).toBeNull();
    expect(info.playerLimitL).toBeNull();
    expect(info.playerLimitR).toBeNull();
  });

  it('alternates field side by total points', () => {
    const start = calculatePointInfo(game({ startLeft: true, teamScore: 0, vsTeamScore: 0 }));
    const afterOne = calculatePointInfo(game({ startLeft: true, teamScore: 1, vsTeamScore: 0 }));
    expect(start.fieldSide).toBe('Left');
    expect(afterOne.fieldSide).toBe('Right');
  });
});

describe('isMixedLinePlayerDisabled', () => {
  it('does not cap at 3 FMP and 3 open when ABBA is off', () => {
    const selectedLeft = ['a', 'b', 'c'];
    const selectedRight = ['d', 'e', 'f'];
    expect(isMixedLinePlayerDisabled(true, selectedLeft, selectedRight, false, null, false)).toBe(false);
    expect(isMixedLinePlayerDisabled(false, selectedLeft, selectedRight, false, null, false)).toBe(false);
  });

  it('caps FMP at 4 when ABBA is off', () => {
    const selectedLeft = ['a', 'b', 'c', 'd'];
    expect(isMixedLinePlayerDisabled(true, selectedLeft, [], false, null, false)).toBe(true);
    expect(isMixedLinePlayerDisabled(false, selectedLeft, [], false, null, false)).toBe(false);
  });

  it('caps open at 4 when ABBA is off', () => {
    const selectedRight = ['a', 'b', 'c', 'd'];
    expect(isMixedLinePlayerDisabled(false, [], selectedRight, false, null, false)).toBe(true);
    expect(isMixedLinePlayerDisabled(true, [], selectedRight, false, null, false)).toBe(false);
  });

  it('caps the other gender at 3 once 4 of one gender are selected', () => {
    const selectedLeft = ['a', 'b', 'c', 'd'];
    const selectedRight = ['e', 'f', 'g'];
    expect(isMixedLinePlayerDisabled(true, selectedLeft, selectedRight, false, null, false)).toBe(true);
    expect(isMixedLinePlayerDisabled(false, selectedLeft, selectedRight, false, null, false)).toBe(true);
  });

  it('still allows a third FMP when four open are selected', () => {
    const selectedLeft = ['a', 'b'];
    const selectedRight = ['c', 'd', 'e', 'f'];
    expect(isMixedLinePlayerDisabled(true, selectedLeft, selectedRight, false, null, false)).toBe(false);
    expect(isMixedLinePlayerDisabled(false, selectedLeft, selectedRight, false, null, false)).toBe(true);
  });

  it('uses per-column ABBA limit when ABBA is on', () => {
    expect(isMixedLinePlayerDisabled(true, ['a', 'b', 'c'], [], true, 3, false)).toBe(true);
    expect(isMixedLinePlayerDisabled(true, ['a', 'b'], [], true, 3, false)).toBe(false);
  });

  it('allows deselecting a capped player', () => {
    const selectedLeft = ['a', 'b', 'c', 'd'];
    expect(isMixedLinePlayerDisabled(true, selectedLeft, [], false, null, true)).toBe(false);
  });
});

describe('splitPlayers', () => {
  const base = {
    teamId: 't',
    teamGroupId: 'g',
    lastName: null,
    nickname: null,
    order: null,
    isPR: false,
  };

  it('puts FMP players on the left for Mixed', () => {
    const fmp = player({ ...base, id: '1', firstName: 'A', type: 'Handler', isFMP: true });
    const open = player({ ...base, id: '2', firstName: 'B', type: 'Cutter', isFMP: false });
    const { playersL, playersR } = splitPlayers([open, fmp], 'Mixed');
    expect(playersL.map((p) => p.id)).toContain('1');
    expect(playersR.map((p) => p.id)).toContain('2');
  });

  it('puts non-cutters on the left for Open', () => {
    const handler = player({ ...base, id: '1', firstName: 'H', type: 'Handler', isFMP: false });
    const cutter = player({ ...base, id: '2', firstName: 'C', type: 'Cutter', isFMP: false });
    const { playersL, playersR } = splitPlayers([cutter, handler], 'Open');
    expect(playersL.map((p) => p.id)).toContain('1');
    expect(playersR.map((p) => p.id)).toContain('2');
  });

  it('alternates left/right by index for Women', () => {
    const p0 = player({ ...base, id: '0', firstName: '0', type: 'Handler', isFMP: false });
    const p1 = player({ ...base, id: '1', firstName: '1', type: 'Handler', isFMP: false });
    const { playersL, playersR } = splitPlayers([p0, p1], 'Women');
    expect(playersL).toHaveLength(1);
    expect(playersR).toHaveLength(1);
    expect(playersL[0].id).toBe('0');
    expect(playersR[0].id).toBe('1');
  });
});
