import type { Player, TeamType } from '@/database/schema';
import type { DraftPointEvent } from '@/lib/draftGame';

export function playersSameGender(teamType: TeamType, a: Player, b: Player): boolean {
  if (teamType === 'Mixed') {
    return a.isFMP === b.isFMP;
  }
  return true;
}

export function activeLinePlayerIds(
  pointPlayerIds: string[],
  events: Pick<DraftPointEvent, 'type' | 'playerOneId' | 'playerTwoId'>[]
): string[] {
  const active = pointPlayerIds.slice(0, 7);
  for (const event of events) {
    if (event.type === 'SUBSTITUTION' && event.playerOneId && event.playerTwoId) {
      const idx = active.indexOf(event.playerOneId);
      if (idx >= 0) {
        active[idx] = event.playerTwoId;
      }
    }
  }
  return active;
}

export function canSubstitute(params: {
  teamType: TeamType;
  roster: Player[];
  pointPlayerIds: string[];
  events: DraftPointEvent[];
  playerOffId: string;
  playerOnId: string;
}): boolean {
  const { teamType, roster, pointPlayerIds, events, playerOffId, playerOnId } = params;
  if (playerOffId === playerOnId) {
    return false;
  }

  const playerMap = new Map(roster.map((p) => [p.id, p]));
  const off = playerMap.get(playerOffId);
  const on = playerMap.get(playerOnId);
  if (!off || !on) {
    return false;
  }
  if (!playersSameGender(teamType, off, on)) {
    return false;
  }

  const active = new Set(activeLinePlayerIds(pointPlayerIds, events));
  if (!active.has(playerOffId)) {
    return false;
  }
  if (active.has(playerOnId)) {
    return false;
  }

  return true;
}
