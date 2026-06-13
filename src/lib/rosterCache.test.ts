import { describe, expect, it } from 'vitest';
import type { Player, Team, TeamGroup } from '@/database/schema';
import {
  addPendingPlayer,
  applyPendingTypeUpdates,
  cloneRosterForEditing,
  createRosterCache,
  getMergedPlayers,
  hasRosterPendingChanges,
  rosterSyncPayload,
} from './rosterCache';

const team: Team = { id: 'team-1', name: 'Test', type: 'Open' };
const defaultGroup: TeamGroup = {
  id: 'group-none',
  name: 'None',
  isActive: false,
  isDefault: true,
  teamId: team.id,
  createdAt: '2026-01-01',
};
const player: Player = {
  id: 'p1',
  firstName: 'Alex',
  lastName: null,
  isFMP: false,
  isPR: false,
  type: 'Cutter',
  nickname: null,
  order: null,
  teamId: team.id,
  teamGroupId: defaultGroup.id,
};

describe('rosterCache', () => {
  it('adds pending players to merged roster', () => {
    const cache = createRosterCache({ team, teamGroups: [defaultGroup], players: [player] });
    const next = addPendingPlayer(cache, { firstName: 'Sam', type: 'Handler' });
    const merged = getMergedPlayers(next);
    expect(merged).toHaveLength(2);
    expect(merged[1].firstName).toBe('Sam');
    expect(merged[1].type).toBe('Handler');
    expect(merged[1].teamGroupId).toBe(defaultGroup.id);
  });

  it('stores isFMP for mixed teams', () => {
    const mixedTeam: Team = { ...team, type: 'Mixed' };
    const cache = createRosterCache({ team: mixedTeam, teamGroups: [defaultGroup], players: [player] });
    const next = addPendingPlayer(cache, { firstName: 'Sam', type: 'Handler', isFMP: true });
    expect(getMergedPlayers(next)[1].isFMP).toBe(true);
  });

  it('applies pending type updates to existing and new players', () => {
    let cache = createRosterCache({ team, teamGroups: [defaultGroup], players: [player] });
    cache = addPendingPlayer(cache, { firstName: 'Sam', type: 'Handler' });
    const newId = cache.pendingNewPlayers[0].id;
    cache = applyPendingTypeUpdates(cache, ['p1', newId], 'Cutter');
    const merged = getMergedPlayers(cache);
    expect(merged.find((p) => p.id === 'p1')?.type).toBe('Cutter');
    expect(merged.find((p) => p.id === newId)?.type).toBe('Cutter');
  });

  it('detects pending changes and builds sync payload', () => {
    const cache = createRosterCache({ team, teamGroups: [defaultGroup], players: [player] });
    expect(hasRosterPendingChanges(cache)).toBe(false);
    expect(rosterSyncPayload(cache)).toEqual({
      groupUpdates: undefined,
      newPlayers: undefined,
      typeUpdates: undefined,
    });

    const editing = addPendingPlayer(cache, { firstName: 'Sam', type: 'Handler' });
    expect(hasRosterPendingChanges(editing)).toBe(true);
    expect(rosterSyncPayload(editing).newPlayers).toHaveLength(1);

    const stored = cloneRosterForEditing(cache);
    expect(hasRosterPendingChanges(stored)).toBe(false);
  });
});
