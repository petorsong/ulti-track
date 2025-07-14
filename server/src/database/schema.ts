import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
})

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
}));

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  isFemaleMatching: boolean('is_female_matching').notNull().default(false),
  isHandler: boolean('is_handler').notNull().default(false),
  isPR: boolean('is_pr').notNull().default(false),
  nickname: varchar('nickname', { length: 255 }),
  teamId: uuid('team_id').references(() => teams.id),
});

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  })
}));
