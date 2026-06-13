import type { Player } from '@/database/schema';
import type { GameAction } from './types';

type LabelVariant = 'button' | 'aria';

function playerName(players: Player[], id: string | null | undefined): string {
  if (!id) {
    return '';
  }
  const player = players.find((p) => p.id === id);
  if (!player) {
    return id;
  }
  return player.nickname || player.firstName;
}

export function getUndoLabel(
  action: GameAction,
  players: Player[],
  options: { variant: LabelVariant }
): string {
  const verbose = options.variant === 'aria';

  switch (action.type) {
    case 'LOG_EVENT': {
      const { event } = action;
      switch (event.type) {
        case 'PASS':
          return verbose
            ? `Undo pass from ${playerName(players, event.playerOneId)} to ${playerName(players, event.playerTwoId)}`
            : 'Undo: Pass';
        case 'BLOCK':
          return verbose
            ? `Undo block by ${playerName(players, event.playerOneId)}`
            : 'Undo: Block';
        case 'TA':
          return verbose
            ? `Undo throwaway by ${playerName(players, event.playerOneId)}`
            : 'Undo: TA';
        case 'DROP':
          return verbose
            ? `Undo drop by ${playerName(players, event.playerOneId)}`
            : 'Undo: Drop';
        case 'TIMEOUT':
          return verbose ? 'Undo our timeout' : 'Undo: Our timeout';
        case 'VS_TIMEOUT':
          return verbose ? 'Undo their timeout' : 'Undo: Their timeout';
        case 'SUBSTITUTION':
          return verbose
            ? `Undo substitution: ${playerName(players, event.playerOneId)} out for ${playerName(players, event.playerTwoId)}`
            : 'Undo: Substitution';
        default:
          return verbose ? `Undo ${event.type}` : `Undo: ${event.type}`;
      }
    }
    case 'START_POINT':
      return verbose ? 'Undo start point' : 'Undo: Start point';
    case 'END_POINT':
      return action.scoreType === 'SCORE'
        ? verbose
          ? 'Undo we scored'
          : 'Undo: WE scored'
        : verbose
          ? 'Undo they scored'
          : 'Undo: THEY scored';
    case 'EDIT_LINE':
      return verbose ? 'Undo edit line' : 'Undo: Edit line';
    case 'SUBSTITUTE':
      return verbose
        ? `Undo substitution: ${playerName(players, action.event.playerOneId)} out for ${playerName(players, action.event.playerTwoId)}`
        : 'Undo: Substitution';
    case 'SET_NEXT_LINE':
      return verbose ? 'Undo next line' : 'Undo: Next line';
    case 'HALFTIME':
      return verbose ? 'Undo halftime' : 'Undo: Halftime';
    case 'END_GAME':
      return verbose ? 'Undo end game' : 'Undo: End game';
    default:
      return verbose ? 'Undo' : 'Undo';
  }
}
