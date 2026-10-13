import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export function createTransactionalDatabase(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurado');
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
  });
  return { pool, db: drizzle(pool, { schema }) };
}
export type TransactionalDatabase = ReturnType<
  typeof createTransactionalDatabase
>["db"];
export type DatabaseTransaction = Parameters<
  Parameters<TransactionalDatabase["transaction"]>[0]
>[0];
