import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import 'dotenv/config';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  logger: true,
  // casing: 'snake_case'
});
