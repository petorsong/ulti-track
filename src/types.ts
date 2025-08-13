import { games, players, teams } from './database/schema';

export type ApiErrorType = {
  error: string;
};

export type PlayerStats = {
  pointsPlayed: number;
  totalPasses: number;
  passesToF: number;
  passesToO: number;
  scores: number;
  assists: number;
  hockeyAssists: number;
  blocks: number;
  throwAways: number;
  drops: number;
};
export type PlayerWithStats = { player: typeof players.$inferSelect; stats: PlayerStats };
export type GameSummary = {
  team: typeof teams.$inferSelect;
  game: typeof games.$inferSelect;
  players: PlayerWithStats[];
};

export class StatsMap {
  private stats: PlayerStats;

  constructor() {
    this.stats = {
      pointsPlayed: 0,
      totalPasses: 0,
      passesToF: 0,
      passesToO: 0,
      scores: 0,
      assists: 0,
      hockeyAssists: 0,
      blocks: 0,
      throwAways: 0,
      drops: 0,
    };
  }

  increment(stat: keyof PlayerStats): void {
    this.stats[stat]++;
  }

  get(stat: keyof PlayerStats): number {
    return this.stats[stat];
  }

  getAllStats(): PlayerStats {
    return { ...this.stats };
  }
}
