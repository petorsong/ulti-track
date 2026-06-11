import type { PlayerWithCounts, Point, TeamWithTeamGroups } from '@/database/schema';
import type { DraftGame } from '@/lib/draftGame';
import { draftToGame } from '@/lib/draftGame';
import { playersWithLineCounts } from '@/lib/playerCounts';
import { calculatePointInfo, splitPlayers } from '@/utils';

export function completedPointsAsPointRows(draft: DraftGame): Point[] {
  return draft.completedPoints.map((p, index) => ({
    id: p.clientPointId,
    gameId: '',
    playerIds: p.playerIds,
    isActive: false,
    createdAt: String(index),
  }));
}

export function draftPlayerColumns(draft: DraftGame): {
  playersL: PlayerWithCounts[];
  playersR: PlayerWithCounts[];
} {
  const withCounts = playersWithLineCounts(draft.rosterSnapshot.players, completedPointsAsPointRows(draft));
  return splitPlayers(withCounts, draft.rosterSnapshot.team.type);
}

export function draftTeamWithGroups(draft: DraftGame): TeamWithTeamGroups {
  return {
    ...draft.rosterSnapshot.team,
    teamGroups: draft.rosterSnapshot.teamGroups,
  };
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
  const { playersL, playersR } = draftPlayerColumns(draft);
  return {
    left: playersL.filter((p) => playerIds.includes(p.id)),
    right: playersR.filter((p) => playerIds.includes(p.id)),
  };
}
