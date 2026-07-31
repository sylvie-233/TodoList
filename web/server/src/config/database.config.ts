import { drizzle } from 'drizzle-orm/node-postgres/driver';
import { Pool } from 'pg';
import * as schema from '../database/schema/index.js';

export function createDb(databaseUrl: string) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
  });
  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
