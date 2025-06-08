import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.POSTGRES_DB_URL!;
const pool = postgres(connectionString, {
  max: 1,
  ssl: 'require',
  connect_timeout: 10,
  idle_timeout: 20,
  prepare: false,
});

export const db = drizzle(pool);
