import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players), // TODO: maybe redundant? consider a default unassigned group
  teamGroups: many(teamGroups),
  games: many(games),
}));

export type Team = typeof teams.$inferSelect;

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  isFMP: boolean('is_fmp').notNull().default(false),
  isHandler: boolean('is_handler').notNull().default(false),
  isPR: boolean('is_pr').notNull().default(false),
  nickname: varchar('nickname', { length: 255 }),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  teamGroupId: uuid('team_group_id')
    .references(() => teamGroups.id, { onDelete: 'set null', onUpdate: 'cascade' })
    .notNull(),
});

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  teamGroup: one(teamGroups, { fields: [players.teamGroupId], references: [teamGroups.id] }),
}));

export type Player = typeof players.$inferSelect;
export type PlayerWithLineCount = Player & { lineCount: number };

export const teamGroups = pgTable(
  'team_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    isDefault: boolean('is_default').notNull().default(false),
    teamId: uuid('team_id')
      .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('team_groups_team_id_idx').on(table.teamId),
    uniqueIndex('team_groups_team_id_is_default_unique_idx')
      .on(table.teamId) // only 1 default group per team
      .where(sql`${table.isDefault} = true`),
  ]
);

export const teamGroupsRelations = relations(teamGroups, ({ one, many }) => ({
  team: one(teams, { fields: [teamGroups.teamId], references: [teams.id] }),
  players: many(players),
}));

export type TeamGroup = typeof teamGroups.$inferSelect;
export type TeamGroupWithPlayers = TeamGroup & { players: Player[] };

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  vsTeamName: varchar('vs_team_name', { length: 255 }).notNull(),
  startOnO: boolean('start_on_o').default(false).notNull(),
  startFRatio: boolean('start_f_ratio').default(false).notNull(),
  startLeft: boolean('start_left').default(false).notNull(),
  teamScore: integer('team_score').default(0).notNull(),
  vsTeamScore: integer('vs_team_score').default(0).notNull(),
  isComplete: boolean('is_complete').default(false).notNull(),
  activePlayerIds: uuid('active_player_ids').array().notNull(),
  halftimeAt: integer('halftime_at'),
  wasLastScoreUs: boolean('was_last_score_us').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export const gamesRelations = relations(games, ({ many, one }) => ({
  team: one(teams, { fields: [games.teamId], references: [teams.id] }),
  points: many(points),
}));

export type Game = typeof games.$inferSelect;

export const points = pgTable('points', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id')
    .references(() => games.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  playerIds: uuid('player_ids').array(7).notNull(), // references prolly doesn't work here
  createdAt: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export const pointsRelations = relations(points, ({ many, one }) => ({
  game: one(games, { fields: [points.gameId], references: [games.id] }),
  events: many(pointEvents),
}));

export const EventTypePG = [
  'VS_SCORE',
  'SCORE',
  'BLOCK',
  'TA',
  'DROP',
  'PASS',
  'CALLAHAN',
  'SUBSTITUTION',
  'TIMEOUT',
  'VS_TIMEOUT',
] as const;
export const EventTypeEnum = pgEnum('eventtype', EventTypePG);
export type EventType = (typeof EventTypePG)[number];

export type EventJsonType = { throwType?: 'HUCK'; assistType?: 'ASSIST' | 'HOCKEY_ASSIST' };

export const pointEvents = pgTable('point_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  pointId: uuid('point_id')
    .references(() => points.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  type: EventTypeEnum('type').notNull(),
  playerOneId: uuid('player_one_id').references(() => players.id),
  playerTwoId: uuid('player_two_id').references(() => players.id),
  eventJson: jsonb('event_json').$type<EventJsonType>(),
  createdAt: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export const pointEventsRelations = relations(pointEvents, ({ one }) => ({
  points: one(points, { fields: [pointEvents.pointId], references: [points.id] }),
  playerOne: one(players, { fields: [pointEvents.playerOneId], references: [players.id] }),
  playerTwo: one(players, { fields: [pointEvents.playerTwoId], references: [players.id] }),
}));

export type InsertPointEvent = typeof pointEvents.$inferInsert;
