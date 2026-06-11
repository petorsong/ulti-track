import type { Player, TeamGroup } from '@/database/schema';
import type { PlayerIdToTeamGroupId } from '@/types';

export function mergePendingGroupUpdates(players: Player[], pendingGroupUpdates: PlayerIdToTeamGroupId[]): Player[] {
  if (pendingGroupUpdates.length === 0) {
    return players;
  }
  const overrides = new Map(pendingGroupUpdates.map((u) => [u.playerId, u.teamGroupId]));
  return players.map((player) => {
    const teamGroupId = overrides.get(player.id);
    return teamGroupId !== undefined ? { ...player, teamGroupId } : player;
  });
}

export function computeActivePlayerIds(
  players: Player[],
  teamGroups: TeamGroup[],
  pendingGroupUpdates: PlayerIdToTeamGroupId[]
): string[] {
  const activeGroupIds = new Set(teamGroups.filter((g) => g.isActive).map((g) => g.id));
  return mergePendingGroupUpdates(players, pendingGroupUpdates)
    .filter((player) => activeGroupIds.has(player.teamGroupId))
    .map((player) => player.id);
}
