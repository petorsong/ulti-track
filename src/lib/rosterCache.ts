import type { Player, Team, TeamGroup } from '@/database/schema';
import type { PlayerIdToTeamGroupId } from '@/types';
import { rosterStorageKey } from '@/lib/draftGame/storage';
import { mergePendingGroupUpdates } from '@/lib/draftGame/rosterUtils';
import type { PersistResult } from '@/lib/draftGame/types';

export type RosterMoveAction = {
  type: 'ROSTER_MOVE';
  priorPendingGroupUpdates: PlayerIdToTeamGroupId[];
};

export type RosterCache = {
  team: Team;
  teamGroups: TeamGroup[];
  players: Player[];
  fetchedAt: string;
  pendingGroupUpdates: PlayerIdToTeamGroupId[];
  podActionLog: RosterMoveAction[];
};

export function createRosterCache(data: {
  team: Team;
  teamGroups: TeamGroup[];
  players: Player[];
}): RosterCache {
  return {
    ...data,
    fetchedAt: new Date().toISOString(),
    pendingGroupUpdates: [],
    podActionLog: [],
  };
}

export function loadRosterCache(teamId: string): RosterCache | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(rosterStorageKey(teamId));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as RosterCache;
    if (parsed.team?.id !== teamId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistRosterCache(cache: RosterCache): PersistResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'unknown', message: 'Storage unavailable' };
  }
  try {
    localStorage.setItem(rosterStorageKey(cache.team.id), JSON.stringify(cache));
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'quota', message: 'Storage full' };
    }
    return { ok: false, error: 'unknown', message: 'Failed to save roster' };
  }
}

export function mergePendingUpdates(updates: PlayerIdToTeamGroupId[]): PlayerIdToTeamGroupId[] {
  const map = new Map<string, string>();
  for (const { playerId, teamGroupId } of updates) {
    map.set(playerId, teamGroupId);
  }
  return Array.from(map.entries()).map(([playerId, teamGroupId]) => ({ playerId, teamGroupId }));
}

export function applyRosterMove(
  cache: RosterCache,
  updates: PlayerIdToTeamGroupId[]
): RosterCache {
  const priorPendingGroupUpdates = [...cache.pendingGroupUpdates];
  const merged = mergePendingUpdates([...cache.pendingGroupUpdates, ...updates]);
  return {
    ...cache,
    pendingGroupUpdates: merged,
    podActionLog: [...cache.podActionLog, { type: 'ROSTER_MOVE', priorPendingGroupUpdates }],
  };
}

export function undoRosterMove(cache: RosterCache): RosterCache {
  if (cache.podActionLog.length === 0) {
    return cache;
  }
  const last = cache.podActionLog[cache.podActionLog.length - 1];
  return {
    ...cache,
    pendingGroupUpdates: last.priorPendingGroupUpdates,
    podActionLog: cache.podActionLog.slice(0, -1),
  };
}

export function getMergedPlayers(cache: RosterCache): Player[] {
  return mergePendingGroupUpdates(cache.players, cache.pendingGroupUpdates);
}

export function clearRosterPendingUpdates(teamId: string): void {
  const cache = loadRosterCache(teamId);
  if (!cache) {
    return;
  }
  persistRosterCache({
    ...cache,
    pendingGroupUpdates: [],
    podActionLog: [],
  });
}
