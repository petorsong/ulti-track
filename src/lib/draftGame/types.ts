import type {
  EventType,
  Game,
  InsertPointEvent,
  Player,
  Team,
  TeamGroup,
  TimeoutsJson,
} from '@/database/schema';

export const DRAFT_SCHEMA_VERSION = 1 as const;

export type DraftPhase = 'lineup' | 'point' | 'complete';

export type DraftSetup = Pick<Game, 'vsTeamName' | 'startOnO' | 'startLeft' | 'startFRatio' | 'startTime'>;

export type RosterSnapshot = {
  team: Team;
  teamGroups: TeamGroup[];
  players: Player[];
};

/** Client-side point id used in events until sync. */
export type DraftPointEvent = InsertPointEvent;

export type ActivePoint = {
  clientPointId: string;
  playerIds: string[];
  events: DraftPointEvent[];
  selectedPlayerId: string;
  nextLineSelection: { left: string[]; right: string[] };
};

export type CompletedPoint = {
  clientPointId: string;
  playerIds: string[];
  events: DraftPointEvent[];
  scoreType: 'SCORE' | 'VS_SCORE';
};

export type LineupSelection = { left: string[]; right: string[] };

export type GameAction =
  | {
      type: 'LOG_EVENT';
      event: DraftPointEvent;
      priorSelectedPlayerId: string;
      priorTimeouts?: TimeoutsJson;
    }
  | { type: 'EDIT_LINE'; priorPlayerIds: string[] }
  | {
      type: 'SUBSTITUTE';
      priorPlayerIds: string[];
      priorSelectedPlayerId: string;
      event: DraftPointEvent;
    }
  | { type: 'SET_NEXT_LINE'; priorSelection: LineupSelection }
  | { type: 'START_POINT'; playerIds: string[]; priorLineupSelection: LineupSelection }
  | {
      type: 'END_POINT';
      scoreType: 'SCORE' | 'VS_SCORE';
      completedPoint: CompletedPoint;
      priorTeamScore: number;
      priorVsTeamScore: number;
      priorWasLastScoreUs: boolean;
      priorPhase: DraftPhase;
      priorLineupSelection: LineupSelection;
    }
  | { type: 'HALFTIME'; priorHalftimeAt: number | null }
  | {
      type: 'END_GAME';
      priorIsComplete: boolean;
      priorPhase: DraftPhase;
    }
  | { type: 'CLEAR_LINE' };

export type DraftGame = {
  schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  draftId: string;
  teamId: string;
  setup: DraftSetup;
  rosterSnapshot: RosterSnapshot;
  activePlayerIds: string[];
  teamScore: number;
  vsTeamScore: number;
  wasLastScoreUs: boolean;
  halftimeAt: number | null;
  isComplete: boolean;
  timeouts: TimeoutsJson;
  completedPoints: CompletedPoint[];
  phase: DraftPhase;
  currentPoint: ActivePoint | null;
  lineupSelection: LineupSelection;
  actionLog: GameAction[];
  updatedAt: string;
};

export type DraftDispatchAction =
  | { type: 'SET_LINEUP_SELECTION'; selection: LineupSelection }
  | { type: 'CLEAR_LINE' }
  | { type: 'SELECT_DISC_HOLDER'; playerId: string }
  | { type: 'LOG_EVENT'; eventType: EventType; playerOneId?: string; playerTwoId?: string }
  | { type: 'TIMEOUT'; isOurTimeout: boolean }
  | { type: 'EDIT_LINE'; playerIds: string[] }
  | { type: 'SUBSTITUTE'; playerOffId: string; playerOnId: string }
  | { type: 'SET_NEXT_LINE'; selection: LineupSelection }
  | { type: 'START_POINT'; playerIds: string[] }
  | { type: 'END_POINT'; scoreType: 'SCORE' | 'VS_SCORE'; scorerId?: string }
  | { type: 'HALFTIME' }
  | { type: 'END_GAME' }
  | { type: 'UNDO_END_GAME' };

export type PersistResult = { ok: true } | { ok: false; error: 'quota' | 'unknown'; message: string };
