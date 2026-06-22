import type { Game } from '@/database/schema';
import type { DraftGame } from './types';

/** Build a Game-shaped object for calculatePointInfo from draft state. */
export function draftToGame(draft: DraftGame): Game {
  return {
    id: '',
    teamId: draft.teamId,
    vsTeamName: draft.setup.vsTeamName,
    startOnO: draft.setup.startOnO,
    startFRatio: draft.setup.startFRatio,
    enforceAbba: draft.setup.startFRatio !== null ? (draft.setup.enforceAbba ?? true) : null,
    startLeft: draft.setup.startLeft,
    teamScore: draft.teamScore,
    vsTeamScore: draft.vsTeamScore,
    isComplete: draft.isComplete,
    activePlayerIds: draft.activePlayerIds,
    halftimeAt: draft.halftimeAt,
    wasLastScoreUs: draft.wasLastScoreUs,
    timeouts: draft.timeouts,
    startTime: draft.setup.startTime,
    clientDraftId: draft.draftId,
    createdAt: draft.updatedAt,
  };
}
