import type { InsertPointEvent } from '@/database/schema';
import type { DraftGame } from './types';
import { draftToGame } from './draftToGame';

export type CompleteGamePayload = {
  draftId: string;
  activePlayerIds: string[];
  game: ReturnType<typeof draftToGame>;
  points: {
    playerIds: string[];
    events: Omit<InsertPointEvent, 'pointId'>[];
    scoreType: 'SCORE' | 'VS_SCORE';
  }[];
};

export function buildCompleteGamePayload(draft: DraftGame): CompleteGamePayload {
  return {
    draftId: draft.draftId,
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
