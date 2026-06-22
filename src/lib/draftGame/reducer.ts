import type { TimeoutsJson } from '@/database/schema';
import { canSubstitute } from '@/lib/substitution';
import type {
  ActivePoint,
  CompletedPoint,
  DraftDispatchAction,
  DraftGame,
  DraftPhase,
  DraftPointEvent,
  GameAction,
} from './types';

function touch(draft: DraftGame): DraftGame {
  return { ...draft, updatedAt: new Date().toISOString() };
}

function currentHalf(draft: DraftGame): 'firstHalf' | 'secondHalf' {
  return draft.halftimeAt != null ? 'secondHalf' : 'firstHalf';
}

function createActivePoint(playerIds: string[]): ActivePoint {
  return {
    clientPointId: crypto.randomUUID(),
    playerIds,
    events: [],
    selectedPlayerId: '',
    nextLineSelection: { left: [], right: [] },
  };
}

export function applyDispatch(draft: DraftGame, action: DraftDispatchAction): DraftGame {
  switch (action.type) {
    case 'SET_LINEUP_SELECTION':
      return touch({ ...draft, lineupSelection: action.selection });

    case 'CLEAR_LINE':
      return touch({ ...draft, lineupSelection: { left: [], right: [] } });

    case 'SELECT_DISC_HOLDER': {
      if (!draft.currentPoint) {
        return draft;
      }
      const selectedPlayerId =
        draft.currentPoint.selectedPlayerId === action.playerId ? '' : action.playerId;
      return touch({
        ...draft,
        currentPoint: { ...draft.currentPoint, selectedPlayerId },
      });
    }

    case 'LOG_EVENT':
    case 'TIMEOUT': {
      if (!draft.currentPoint) {
        return draft;
      }
      const point = draft.currentPoint;
      let event: DraftPointEvent;
      let selectedPlayerId = point.selectedPlayerId;
      let timeouts = draft.timeouts;
      let priorTimeouts: TimeoutsJson | undefined;

      if (action.type === 'TIMEOUT') {
        const half = currentHalf(draft);
        priorTimeouts = structuredClone(draft.timeouts);
        timeouts = structuredClone(draft.timeouts);
        if (action.isOurTimeout) {
          timeouts.ourTimeouts[half]--;
        } else {
          timeouts.vsTimeouts[half]--;
          selectedPlayerId = '';
        }
        event = {
          pointId: point.clientPointId,
          type: action.isOurTimeout ? 'TIMEOUT' : 'VS_TIMEOUT',
        };
      } else {
        const { eventType, playerOneId, playerTwoId } = action;
        if (eventType === 'PASS' && playerOneId && playerTwoId) {
          event = {
            pointId: point.clientPointId,
            type: 'PASS',
            playerOneId,
            playerTwoId,
          };
          selectedPlayerId = playerTwoId;
        } else {
          event = {
            pointId: point.clientPointId,
            type: eventType,
            playerOneId,
          };
          selectedPlayerId = '';
        }
      }

      const logAction: GameAction = {
        type: 'LOG_EVENT',
        event,
        priorSelectedPlayerId: point.selectedPlayerId,
        ...(priorTimeouts ? { priorTimeouts } : {}),
      };

      return touch({
        ...draft,
        timeouts,
        actionLog: [...draft.actionLog, logAction],
        currentPoint: {
          ...point,
          events: [...point.events, event],
          selectedPlayerId,
        },
      });
    }

    case 'EDIT_LINE': {
      if (!draft.currentPoint) {
        return draft;
      }
      const logAction: GameAction = {
        type: 'EDIT_LINE',
        priorPlayerIds: [...draft.currentPoint.playerIds],
      };
      return touch({
        ...draft,
        actionLog: [...draft.actionLog, logAction],
        currentPoint: { ...draft.currentPoint, playerIds: action.playerIds },
      });
    }

    case 'SUBSTITUTE': {
      if (!draft.currentPoint) {
        return draft;
      }
      const point = draft.currentPoint;
      const { playerOffId, playerOnId } = action;
      const roster = draft.rosterSnapshot.players;
      if (
        !canSubstitute({
          teamType: draft.rosterSnapshot.team.type,
          roster,
          pointPlayerIds: point.playerIds,
          events: point.events,
          playerOffId,
          playerOnId,
        })
      ) {
        return draft;
      }

      const event: DraftPointEvent = {
        pointId: point.clientPointId,
        type: 'SUBSTITUTION',
        playerOneId: playerOffId,
        playerTwoId: playerOnId,
      };
      const playerIds = point.playerIds.includes(playerOnId)
        ? point.playerIds
        : [...point.playerIds, playerOnId];
      const selectedPlayerId =
        point.selectedPlayerId === playerOffId ? playerOnId : point.selectedPlayerId;
      const logAction: GameAction = {
        type: 'SUBSTITUTE',
        priorPlayerIds: [...point.playerIds],
        priorSelectedPlayerId: point.selectedPlayerId,
        event,
      };

      return touch({
        ...draft,
        actionLog: [...draft.actionLog, logAction],
        currentPoint: {
          ...point,
          playerIds,
          events: [...point.events, event],
          selectedPlayerId,
        },
      });
    }

    case 'SET_NEXT_LINE': {
      if (!draft.currentPoint) {
        return draft;
      }
      const logAction: GameAction = {
        type: 'SET_NEXT_LINE',
        priorSelection: { ...draft.currentPoint.nextLineSelection },
      };
      return touch({
        ...draft,
        actionLog: [...draft.actionLog, logAction],
        currentPoint: { ...draft.currentPoint, nextLineSelection: action.selection },
      });
    }

    case 'START_POINT': {
      const priorLineupSelection = { ...draft.lineupSelection };
      const currentPoint = createActivePoint(action.playerIds);
      const logAction: GameAction = {
        type: 'START_POINT',
        playerIds: action.playerIds,
        priorLineupSelection,
      };
      return touch({
        ...draft,
        phase: 'point',
        currentPoint,
        lineupSelection: { left: [], right: [] },
        actionLog: [...draft.actionLog, logAction],
      });
    }

    case 'END_POINT': {
      if (!draft.currentPoint) {
        return draft;
      }
      const point = draft.currentPoint;
      const scoreEvent: DraftPointEvent = {
        pointId: point.clientPointId,
        type: action.scoreType,
        ...(action.scoreType === 'SCORE' && action.scorerId ? { playerOneId: action.scorerId } : {}),
      };
      const events = [...point.events, scoreEvent];
      const completedPoint: CompletedPoint = {
        clientPointId: point.clientPointId,
        playerIds: point.playerIds,
        events,
        scoreType: action.scoreType,
      };

      const priorTeamScore = draft.teamScore;
      const priorVsTeamScore = draft.vsTeamScore;
      const priorWasLastScoreUs = draft.wasLastScoreUs;
      const priorPhase = draft.phase;
      const priorLineupSelection = { ...draft.lineupSelection };

      let teamScore = draft.teamScore;
      let vsTeamScore = draft.vsTeamScore;
      let wasLastScoreUs = draft.wasLastScoreUs;
      if (action.scoreType === 'SCORE') {
        teamScore++;
        wasLastScoreUs = true;
      } else {
        vsTeamScore++;
        wasLastScoreUs = false;
      }

      const logAction: GameAction = {
        type: 'END_POINT',
        scoreType: action.scoreType,
        completedPoint,
        priorTeamScore,
        priorVsTeamScore,
        priorWasLastScoreUs,
        priorPhase,
        priorLineupSelection,
      };

      const nextSelection = point.nextLineSelection;
      const base: DraftGame = touch({
        ...draft,
        teamScore,
        vsTeamScore,
        wasLastScoreUs,
        completedPoints: [...draft.completedPoints, completedPoint],
        currentPoint: null,
        actionLog: [...draft.actionLog, logAction],
        lineupSelection: nextSelection,
        phase: 'lineup',
      });

      const nextIds = [...nextSelection.left, ...nextSelection.right];
      if (nextIds.length === 7) {
        return applyDispatch(base, { type: 'START_POINT', playerIds: nextIds });
      }

      return base;
    }

    case 'HALFTIME': {
      if (draft.halftimeAt != null) {
        return draft;
      }
      const totalPoints = draft.teamScore + draft.vsTeamScore;
      const logAction: GameAction = {
        type: 'HALFTIME',
        priorHalftimeAt: draft.halftimeAt,
      };
      return touch({
        ...draft,
        halftimeAt: totalPoints,
        actionLog: [...draft.actionLog, logAction],
      });
    }

    case 'END_GAME': {
      if (draft.halftimeAt == null || draft.isComplete) {
        return draft;
      }
      const logAction: GameAction = {
        type: 'END_GAME',
        priorIsComplete: draft.isComplete,
        priorPhase: draft.phase,
      };
      return touch({
        ...draft,
        isComplete: true,
        phase: 'complete',
        actionLog: [...draft.actionLog, logAction],
      });
    }

    case 'UNDO_END_GAME': {
      return undoAction(draft);
    }

    default:
      return draft;
  }
}

export function undoAction(draft: DraftGame): DraftGame {
  if (draft.actionLog.length === 0) {
    return draft;
  }

  const action = draft.actionLog[draft.actionLog.length - 1];
  const actionLog = draft.actionLog.slice(0, -1);

  switch (action.type) {
    case 'LOG_EVENT': {
      if (!draft.currentPoint) {
        return touch({ ...draft, actionLog });
      }
      const events = draft.currentPoint.events.slice(0, -1);
      return touch({
        ...draft,
        actionLog,
        timeouts: action.priorTimeouts ?? draft.timeouts,
        currentPoint: {
          ...draft.currentPoint,
          events,
          selectedPlayerId: action.priorSelectedPlayerId,
        },
      });
    }

    case 'EDIT_LINE': {
      if (!draft.currentPoint) {
        return touch({ ...draft, actionLog });
      }
      return touch({
        ...draft,
        actionLog,
        currentPoint: { ...draft.currentPoint, playerIds: action.priorPlayerIds },
      });
    }

    case 'SUBSTITUTE': {
      if (!draft.currentPoint) {
        return touch({ ...draft, actionLog });
      }
      const events = draft.currentPoint.events.slice(0, -1);
      return touch({
        ...draft,
        actionLog,
        currentPoint: {
          ...draft.currentPoint,
          playerIds: action.priorPlayerIds,
          events,
          selectedPlayerId: action.priorSelectedPlayerId,
        },
      });
    }

    case 'SET_NEXT_LINE': {
      if (!draft.currentPoint) {
        return touch({ ...draft, actionLog });
      }
      return touch({
        ...draft,
        actionLog,
        currentPoint: { ...draft.currentPoint, nextLineSelection: action.priorSelection },
      });
    }

    case 'START_POINT':
      return touch({
        ...draft,
        actionLog,
        phase: 'lineup',
        currentPoint: null,
        lineupSelection: action.priorLineupSelection,
      });

    case 'END_POINT': {
      const { completedPoint } = action;
      const completedPoints = draft.completedPoints.slice(0, -1);
      return touch({
        ...draft,
        actionLog,
        teamScore: action.priorTeamScore,
        vsTeamScore: action.priorVsTeamScore,
        wasLastScoreUs: action.priorWasLastScoreUs,
        isComplete: false,
        phase: 'point',
        lineupSelection: action.priorLineupSelection,
        completedPoints,
        currentPoint: {
          clientPointId: completedPoint.clientPointId,
          playerIds: completedPoint.playerIds,
          events: completedPoint.events.slice(0, -1),
          selectedPlayerId: '',
          nextLineSelection: action.priorLineupSelection,
        },
      });
    }

    case 'HALFTIME':
      return touch({
        ...draft,
        actionLog,
        halftimeAt: action.priorHalftimeAt,
      });

    case 'END_GAME':
      return touch({
        ...draft,
        actionLog,
        isComplete: action.priorIsComplete,
        phase: action.priorPhase,
      });

    case 'CLEAR_LINE':
      return draft;

    default:
      return touch({ ...draft, actionLog });
  }
}

export function lastUndoableAction(draft: DraftGame): GameAction | null {
  if (draft.actionLog.length === 0) {
    return null;
  }
  return draft.actionLog[draft.actionLog.length - 1];
}

export function canUndoOnLineup(draft: DraftGame): boolean {
  return draft.actionLog.length > 0;
}

export function canUndoOnPoint(draft: DraftGame): boolean {
  return draft.actionLog.length > 0;
}

export function afterUndoNavigation(
  draft: DraftGame,
  undoneAction: GameAction
): DraftPhase {
  if (undoneAction.type === 'END_POINT') {
    return 'point';
  }
  if (undoneAction.type === 'START_POINT') {
    return 'lineup';
  }
  if (undoneAction.type === 'END_GAME') {
    return draft.phase === 'complete' ? 'complete' : draft.phase;
  }
  return draft.phase;
}
