import { describe, expect, it } from 'vitest';
import type { Player, Team, TeamGroup } from '@/database/schema';
import { createDraft } from './createDraft';
import { applyDispatch, undoAction } from './reducer';
import { buildCompleteGamePayload } from './syncPayload';
import { computeActivePlayerIds, activeTeamGroups, playersForActiveGame } from './rosterUtils';

const team: Team = { id: 'team-1', name: 'Test', type: 'Open' };
const groupA: TeamGroup = {
  id: 'group-a',
  name: 'Pod 1',
  isActive: true,
  isDefault: true,
  teamId: team.id,
  createdAt: '2025-01-01',
};
const groupB: TeamGroup = {
  id: 'group-b',
  name: 'Pod 2',
  isActive: false,
  isDefault: false,
  teamId: team.id,
  createdAt: '2025-01-01',
};

function mkPlayer(id: string, teamGroupId: string): Player {
  return {
    id,
    firstName: id,
    lastName: null,
    isFMP: false,
    isPR: false,
    type: 'Cutter',
    nickname: null,
    order: null,
    teamId: team.id,
    teamGroupId,
  };
}

const players = Array.from({ length: 7 }, (_, i) => mkPlayer(`p${i}`, groupA.id));

function baseDraft() {
  return createDraft({
    teamId: team.id,
    setup: {
      vsTeamName: 'Opp',
      startOnO: false,
      startLeft: false,
      startFRatio: null,
      startTime: null,
    },
    rosterSnapshot: { team, teamGroups: [groupA], players },
    activePlayerIds: players.map((p) => p.id),
  });
}

describe('computeActivePlayerIds', () => {
  it('includes only players in active groups after pending updates', () => {
    const ids = computeActivePlayerIds(players, [groupA, groupB], [
      { playerId: 'p0', teamGroupId: groupB.id },
    ]);
    expect(ids).toHaveLength(6);
    expect(ids).not.toContain('p0');
  });
});

describe('activeTeamGroups', () => {
  it('excludes inactive groups', () => {
    expect(activeTeamGroups([groupA, groupB])).toEqual([groupA]);
  });
});

describe('playersForActiveGame', () => {
  it('keeps only players in activePlayerIds', () => {
    const inactive = mkPlayer('bench', groupB.id);
    const roster = [...players, inactive];
    const activeIds = players.map((p) => p.id);
    expect(playersForActiveGame(roster, activeIds)).toHaveLength(7);
    expect(playersForActiveGame(roster, activeIds).map((p) => p.id)).not.toContain('bench');
  });
});

describe('draft reducer', () => {
  it('starts a point and undoes start', () => {
    const playerIds = players.map((p) => p.id);
    let draft = applyDispatch(baseDraft(), {
      type: 'SET_LINEUP_SELECTION',
      selection: { left: playerIds.slice(0, 4), right: playerIds.slice(4) },
    });
    draft = applyDispatch(draft, { type: 'START_POINT', playerIds });
    expect(draft.phase).toBe('point');
    expect(draft.currentPoint?.playerIds).toHaveLength(7);

    draft = undoAction(draft);
    expect(draft.phase).toBe('lineup');
    expect(draft.currentPoint).toBeNull();
    expect(draft.lineupSelection.left).toHaveLength(4);
  });

  it('logs pass and undoes disc holder', () => {
    const playerIds = players.map((p) => p.id);
    let draft = applyDispatch(baseDraft(), { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'SELECT_DISC_HOLDER', playerId: 'p0' });
    draft = applyDispatch(draft, {
      type: 'LOG_EVENT',
      eventType: 'PASS',
      playerOneId: 'p0',
      playerTwoId: 'p1',
    });
    expect(draft.currentPoint?.events).toHaveLength(1);
    expect(draft.currentPoint?.selectedPlayerId).toBe('p1');

    draft = undoAction(draft);
    expect(draft.currentPoint?.events).toHaveLength(0);
    expect(draft.currentPoint?.selectedPlayerId).toBe('p0');
  });

  it('ends point with score cap at 15', () => {
    let draft = baseDraft();
    draft = { ...draft, teamScore: 14, vsTeamScore: 0 };
    const playerIds = players.map((p) => p.id);
    draft = applyDispatch(draft, { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'END_POINT', scoreType: 'SCORE', scorerId: 'p0' });
    expect(draft.teamScore).toBe(15);
    expect(draft.phase).toBe('complete');
    expect(draft.isComplete).toBe(true);
  });

  it('sets halftime at total points played', () => {
    let draft = { ...baseDraft(), teamScore: 3, vsTeamScore: 2 };
    draft = applyDispatch(draft, { type: 'HALFTIME' });
    expect(draft.halftimeAt).toBe(5);
  });

  it('substitutes a player and appends them to point playerIds', () => {
    const bench = mkPlayer('bench', groupA.id);
    const roster = [...players, bench];
    const playerIds = players.map((p) => p.id);
    let draft = createDraft({
      teamId: team.id,
      setup: baseDraft().setup,
      rosterSnapshot: { team, teamGroups: [groupA], players: roster },
      activePlayerIds: roster.map((p) => p.id),
    });
    draft = applyDispatch(draft, { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'SELECT_DISC_HOLDER', playerId: 'p0' });
    draft = applyDispatch(draft, { type: 'SUBSTITUTE', playerOffId: 'p0', playerOnId: 'bench' });

    expect(draft.currentPoint?.playerIds).toHaveLength(8);
    expect(draft.currentPoint?.playerIds).toContain('bench');
    expect(draft.currentPoint?.events).toHaveLength(1);
    expect(draft.currentPoint?.events[0]).toMatchObject({
      type: 'SUBSTITUTION',
      playerOneId: 'p0',
      playerTwoId: 'bench',
    });
    expect(draft.currentPoint?.selectedPlayerId).toBe('bench');

    draft = undoAction(draft);
    expect(draft.currentPoint?.playerIds).toHaveLength(7);
    expect(draft.currentPoint?.events).toHaveLength(0);
    expect(draft.currentPoint?.selectedPlayerId).toBe('p0');
  });

  it('keeps disc holder unchanged when subbed player does not have the disc', () => {
    const bench = mkPlayer('bench', groupA.id);
    const roster = [...players, bench];
    const playerIds = players.map((p) => p.id);
    let draft = createDraft({
      teamId: team.id,
      setup: baseDraft().setup,
      rosterSnapshot: { team, teamGroups: [groupA], players: roster },
      activePlayerIds: roster.map((p) => p.id),
    });
    draft = applyDispatch(draft, { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'SELECT_DISC_HOLDER', playerId: 'p1' });
    draft = applyDispatch(draft, { type: 'SUBSTITUTE', playerOffId: 'p0', playerOnId: 'bench' });
    expect(draft.currentPoint?.selectedPlayerId).toBe('p1');
  });
});

describe('buildCompleteGamePayload', () => {
  it('strips pointId from events for sync', () => {
    const playerIds = players.map((p) => p.id);
    let draft = applyDispatch(baseDraft(), { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'END_POINT', scoreType: 'VS_SCORE' });
    const payload = buildCompleteGamePayload(draft);
    expect(payload.points).toHaveLength(1);
    expect(payload.points[0].events[0]).not.toHaveProperty('pointId');
  });
});
