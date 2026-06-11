import type { DraftGame, DraftSetup, RosterSnapshot } from './types';
import { DRAFT_SCHEMA_VERSION } from './types';
import { defaultTimeouts } from './defaults';

export function createDraft(params: {
  teamId: string;
  setup: DraftSetup;
  rosterSnapshot: RosterSnapshot;
  activePlayerIds: string[];
}): DraftGame {
  const { teamId, setup, rosterSnapshot, activePlayerIds } = params;
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    draftId: crypto.randomUUID(),
    teamId,
    setup,
    rosterSnapshot,
    activePlayerIds,
    teamScore: 0,
    vsTeamScore: 0,
    wasLastScoreUs: !setup.startOnO,
    halftimeAt: null,
    isComplete: false,
    timeouts: defaultTimeouts(),
    completedPoints: [],
    phase: 'lineup',
    currentPoint: null,
    lineupSelection: { left: [], right: [] },
    actionLog: [],
    updatedAt: new Date().toISOString(),
  };
}
