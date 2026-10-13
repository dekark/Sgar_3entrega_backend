import 'dotenv/config';

import {
  createDatabase,
  Database,
} from './database';

export class DatabaseService {

  readonly db: Database;

  constructor(
    databaseUrl = process.env.DATABASE_URL ?? '',
  ) {
    this.db = createDatabase(
      databaseUrl,
    );
  }
}
