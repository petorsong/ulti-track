import { pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  isFemaleMatching: boolean('is_female_matching').notNull().default(false),
  isHandler: boolean('is_handler').notNull().default(false),
  isPR: boolean('is_pr').notNull().default(false),
  nickname: varchar('nickname', { length: 255 }),
});
