import { CURRENT_SCHEMA_VERSION, migrations } from './schema';

export type SQLiteDatabaseLike = {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
};

type UserVersionRow = {
  user_version: number;
};

export async function migrateDatabase(db: SQLiteDatabaseLike): Promise<void> {
  const versionRow = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  const pendingMigrations = migrations.filter((migration) => migration.version > currentVersion);

  for (const migration of pendingMigrations) {
    await db.execAsync(migration.sql);
    await db.execAsync(`
INSERT OR REPLACE INTO schema_migrations (version, applied_at)
VALUES (${migration.version}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
PRAGMA user_version = ${migration.version};
`);
  }
}
