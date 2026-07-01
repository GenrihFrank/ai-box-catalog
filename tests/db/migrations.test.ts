import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, migrateDatabase, migrations, type SQLiteDatabaseLike } from '../../src/db';

class FakeDatabase implements SQLiteDatabaseLike {
  statements: string[] = [];

  constructor(private userVersion: number) {}

  async execAsync(sql: string): Promise<void> {
    this.statements.push(sql);
    const match = sql.match(/PRAGMA user_version = (\d+)/);
    if (match) {
      this.userVersion = Number(match[1]);
    }
  }

  async getFirstAsync<T>(_sql: string): Promise<T | null> {
    return { user_version: this.userVersion } as T;
  }
}

describe('database migrations', () => {
  it('defines the initial catalog tables', () => {
    const initialSql = migrations[0].sql;

    expect(initialSql).toContain('CREATE TABLE IF NOT EXISTS boxes');
    expect(initialSql).toContain('CREATE TABLE IF NOT EXISTS items');
    expect(initialSql).toContain('CREATE TABLE IF NOT EXISTS box_photos');
    expect(initialSql).toContain('CREATE TABLE IF NOT EXISTS extraction_jobs');
    expect(initialSql).toContain('CREATE TABLE IF NOT EXISTS item_suggestions');
    expect(initialSql).toContain("'on-device-vlm'");
  });

  it('applies pending migrations and updates user_version', async () => {
    const db = new FakeDatabase(0);

    await migrateDatabase(db);

    expect(db.statements.join('\n')).toContain('CREATE TABLE IF NOT EXISTS boxes');
    expect(db.statements.join('\n')).toContain(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION}`);
  });

  it('does nothing when the database is already current', async () => {
    const db = new FakeDatabase(CURRENT_SCHEMA_VERSION);

    await migrateDatabase(db);

    expect(db.statements).toEqual([]);
  });
});
