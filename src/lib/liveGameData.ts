import type { PlayerWithCounts, Point, TeamWithTeamGroups } from '@/database/schema';
import type { DraftGame } from '@/lib/draftGame';
import { activeTeamGroups, draftToGame, playersForActiveGame } from '@/lib/draftGame';
import { playersWithLiveCounts } from '@/lib/playerCounts';
import { activeLinePlayerIds } from '@/lib/substitution';
import { calculatePointInfo, splitPlayers } from '@/utils';

export function completedPointsAsPointRows(draft: DraftGame): Point[] {
  return draft.completedPoints
    .map((p, index) => ({
      id: p.clientPointId,
      gameId: '',
      playerIds: p.playerIds,
      isActive: false,
      createdAt: String(index),
    }))
    .toReversed();
}

function playersWithDraftCounts(draft: DraftGame, players: Parameters<typeof playersWithLiveCounts>[0]) {
  const currentPoint = draft.phase === 'point' ? draft.currentPoint : null;
  return playersWithLiveCounts(players, completedPointsAsPointRows(draft), currentPoint);
}

export function draftPlayerColumns(draft: DraftGame): {
  playersL: PlayerWithCounts[];
  playersR: PlayerWithCounts[];
} {
  const players = playersForActiveGame(draft.rosterSnapshot.players, draft.activePlayerIds);
  const withCounts = playersWithDraftCounts(draft, players);
  return splitPlayers(withCounts, draft.rosterSnapshot.team.type);
}

export function draftTeamWithGroups(draft: DraftGame): TeamWithTeamGroups {
  return {
    ...draft.rosterSnapshot.team,
    teamGroups: activeTeamGroups(draft.rosterSnapshot.teamGroups),
  };
}

export function draftTeamWithAllGroups(draft: DraftGame): TeamWithTeamGroups {
  return {
    ...draft.rosterSnapshot.team,
    teamGroups: draft.rosterSnapshot.teamGroups,
  };
}

function draftRosterPlayerColumns(draft: DraftGame): {
  playersL: PlayerWithCounts[];
  playersR: PlayerWithCounts[];
} {
  const withCounts = playersWithDraftCounts(draft, draft.rosterSnapshot.players);
  return splitPlayers(withCounts, draft.rosterSnapshot.team.type);
}

export function draftPointInfo(draft: DraftGame) {
  const game = draftToGame(draft);
  return {
    vsTeamName: draft.setup.vsTeamName,
    teamScore: draft.teamScore,
    vsTeamScore: draft.vsTeamScore,
    ...calculatePointInfo(game),
  };
}

export function draftNextPointInfo(draft: DraftGame) {
  const game = draftToGame(draft);
  return calculatePointInfo({ ...game, teamScore: game.teamScore + 1 });
}

export function linePlayersFromIds(
  draft: DraftGame,
  playerIds: string[]
): { left: PlayerWithCounts[]; right: PlayerWithCounts[] } {
  const { playersL, playersR } = draftRosterPlayerColumns(draft);
  return {
    left: playersL.filter((p) => playerIds.includes(p.id)),
    right: playersR.filter((p) => playerIds.includes(p.id)),
  };
}

export function activeLinePlayers(draft: DraftGame): { left: PlayerWithCounts[]; right: PlayerWithCounts[] } {
  if (!draft.currentPoint) {
    return { left: [], right: [] };
  }
  const { playerIds, events } = draft.currentPoint;
  return linePlayersFromIds(draft, activeLinePlayerIds(playerIds, events));
}

export function benchPlayersForSubstitution(draft: DraftGame): { left: PlayerWithCounts[]; right: PlayerWithCounts[] } {
  if (!draft.currentPoint) {
    return { left: [], right: [] };
  }
  const activeIds = new Set(activeLinePlayerIds(draft.currentPoint.playerIds, draft.currentPoint.events));
  const { playersL, playersR } = draftRosterPlayerColumns(draft);
  return {
    left: playersL.filter((p) => !activeIds.has(p.id)),
    right: playersR.filter((p) => !activeIds.has(p.id)),
  };
}
