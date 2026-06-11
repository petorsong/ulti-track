import type { InsertPointEvent } from '@/database/schema';
import type { PlayerIdToTeamGroupId } from '@/types';
import type { DraftGame } from './types';
import { draftToGame } from './draftToGame';

export type CompleteGamePayload = {
  draftId: string;
  rosterUpdates?: PlayerIdToTeamGroupId[];
  activePlayerIds: string[];
  game: ReturnType<typeof draftToGame>;
  points: {
    playerIds: string[];
    events: Omit<InsertPointEvent, 'pointId'>[];
    scoreType: 'SCORE' | 'VS_SCORE';
  }[];
};

export function buildCompleteGamePayload(
  draft: DraftGame,
  rosterUpdates?: PlayerIdToTeamGroupId[]
): CompleteGamePayload {
  return {
    draftId: draft.draftId,
    rosterUpdates: rosterUpdates?.length ? rosterUpdates : undefined,
    activePlayerIds: draft.activePlayerIds,
    game: draftToGame(draft),
    points: draft.completedPoints.map((point) => ({
      playerIds: point.playerIds,
      events: point.events.map((event) => {
        const { pointId, ...rest } = event;
        void pointId;
        return rest;
      }),
      scoreType: point.scoreType,
    })),
  };
}
