import type { Player, PlayerType, Team, TeamGroup } from '@/database/schema';
import type { PlayerIdToTeamGroupId } from '@/types';
import { rosterStorageKey } from '@/lib/draftGame/storage';
import { mergePendingGroupUpdates } from '@/lib/draftGame/rosterUtils';
import type { PersistResult } from '@/lib/draftGame/types';

export type RosterMoveAction = {
  type: 'ROSTER_MOVE';
  priorPendingGroupUpdates: PlayerIdToTeamGroupId[];
};

export type PendingNewPlayer = {
  id: string;
  firstName: string;
  type: PlayerType;
  teamGroupId: string;
  isFMP: boolean;
};

export type PendingTypeUpdate = {
  playerId: string;
  type: PlayerType;
};

export type RosterCache = {
  team: Team;
  teamGroups: TeamGroup[];
  players: Player[];
  fetchedAt: string;
  pendingGroupUpdates: PlayerIdToTeamGroupId[];
  pendingNewPlayers: PendingNewPlayer[];
  pendingTypeUpdates: PendingTypeUpdate[];
  podActionLog: RosterMoveAction[];
};

function pendingNewPlayerToPlayer(pending: PendingNewPlayer, teamId: string): Player {
  return {
    id: pending.id,
    firstName: pending.firstName,
    lastName: null,
    isFMP: pending.isFMP,
    isPR: false,
    type: pending.type,
    nickname: null,
    order: null,
    teamId,
    teamGroupId: pending.teamGroupId,
  };
}

function mergePendingTypeUpdates(players: Player[], updates: PendingTypeUpdate[]): Player[] {
  if (updates.length === 0) {
    return players;
  }
  const overrides = new Map(updates.map((u) => [u.playerId, u.type]));
  return players.map((player) => {
    const type = overrides.get(player.id);
    return type !== undefined ? { ...player, type } : player;
  });
}

export function createRosterCache(data: {
  team: Team;
  teamGroups: TeamGroup[];
  players: Player[];
}): RosterCache {
  return {
    ...data,
    fetchedAt: new Date().toISOString(),
    pendingGroupUpdates: [],
    pendingNewPlayers: [],
    pendingTypeUpdates: [],
    podActionLog: [],
  };
}

export function normalizeRosterCache(cache: RosterCache): RosterCache {
  return {
    ...cache,
    pendingGroupUpdates: cache.pendingGroupUpdates ?? [],
    pendingNewPlayers: cache.pendingNewPlayers ?? [],
    pendingTypeUpdates: cache.pendingTypeUpdates ?? [],
    podActionLog: cache.podActionLog ?? [],
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
    return normalizeRosterCache(parsed);
  } catch {
    return null;
  }
}

export function persistRosterCache(cache: RosterCache): PersistResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'unknown', message: 'Storage unavailable' };
  }
  const stored: RosterCache = {
    ...cache,
    pendingGroupUpdates: [],
    pendingNewPlayers: [],
    pendingTypeUpdates: [],
    podActionLog: [],
  };
  try {
    localStorage.setItem(rosterStorageKey(cache.team.id), JSON.stringify(stored));
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
  const withTypes = mergePendingTypeUpdates(cache.players, cache.pendingTypeUpdates);
  const withGroups = mergePendingGroupUpdates(withTypes, cache.pendingGroupUpdates);
  const newPlayers = cache.pendingNewPlayers.map((p) => pendingNewPlayerToPlayer(p, cache.team.id));
  return [...withGroups, ...newPlayers];
}

export function addPendingPlayer(
  cache: RosterCache,
  data: { firstName: string; type: PlayerType; isFMP?: boolean }
): RosterCache {
  const defaultGroup = cache.teamGroups.find((g) => g.isDefault);
  if (!defaultGroup) {
    return cache;
  }
  const pending: PendingNewPlayer = {
    id: crypto.randomUUID(),
    firstName: data.firstName.trim(),
    type: data.type,
    teamGroupId: defaultGroup.id,
    isFMP: cache.team.type === 'Mixed' ? (data.isFMP ?? false) : false,
  };
  return {
    ...cache,
    pendingNewPlayers: [...cache.pendingNewPlayers, pending],
  };
}

export function applyPendingTypeUpdate(cache: RosterCache, playerId: string, type: PlayerType): RosterCache {
  const isNew = cache.pendingNewPlayers.some((p) => p.id === playerId);
  if (isNew) {
    return {
      ...cache,
      pendingNewPlayers: cache.pendingNewPlayers.map((p) => (p.id === playerId ? { ...p, type } : p)),
    };
  }
  const pendingTypeUpdates = [
    ...cache.pendingTypeUpdates.filter((u) => u.playerId !== playerId),
    { playerId, type },
  ];
  return { ...cache, pendingTypeUpdates };
}

export function applyPendingTypeUpdates(
  cache: RosterCache,
  playerIds: string[],
  type: PlayerType
): RosterCache {
  return playerIds.reduce((next, playerId) => applyPendingTypeUpdate(next, playerId, type), cache);
}

export function cloneRosterForEditing(cache: RosterCache): RosterCache {
  return {
    ...cache,
    pendingGroupUpdates: [],
    pendingNewPlayers: [],
    pendingTypeUpdates: [],
    podActionLog: [],
  };
}

export function hasRosterPendingChanges(cache: RosterCache): boolean {
  return (
    cache.pendingGroupUpdates.length > 0 ||
    cache.pendingNewPlayers.length > 0 ||
    cache.pendingTypeUpdates.length > 0
  );
}

export function rosterSyncPayload(cache: RosterCache) {
  return {
    groupUpdates: cache.pendingGroupUpdates.length ? cache.pendingGroupUpdates : undefined,
    newPlayers: cache.pendingNewPlayers.length ? cache.pendingNewPlayers : undefined,
    typeUpdates: cache.pendingTypeUpdates.length ? cache.pendingTypeUpdates : undefined,
  };
}
