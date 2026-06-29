import type { Box, BoxRepository, CreateBoxInput } from '../../domain/boxes';

type BoxRow = {
  id: string;
  number: number;
  label: string | null;
  created_at: string;
  updated_at: string;
};

export type SqliteBoxDatabase = {
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
};

export class SqliteBoxRepository implements BoxRepository {
  constructor(private readonly db: SqliteBoxDatabase) {}

  async create(input: CreateBoxInput): Promise<Box> {
    await this.db.runAsync(
      `
INSERT INTO boxes (id, number, label, created_at, updated_at)
VALUES (?, ?, ?, ?, ?);
`,
      input.id,
      input.number,
      input.label ?? null,
      input.createdAt,
      input.updatedAt
    );

    return {
      id: input.id,
      number: input.number,
      label: input.label,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
  }

  async list(): Promise<Box[]> {
    const rows = await this.db.getAllAsync<BoxRow>(`
SELECT id, number, label, created_at, updated_at
FROM boxes
ORDER BY number ASC;
`);

    return rows.map(toBox);
  }

  async findById(id: string): Promise<Box | null> {
    const row = await this.db.getFirstAsync<BoxRow>(
      `
SELECT id, number, label, created_at, updated_at
FROM boxes
WHERE id = ?;
`,
      id
    );

    return row ? toBox(row) : null;
  }

  async findByNumber(number: number): Promise<Box | null> {
    const row = await this.db.getFirstAsync<BoxRow>(
      `
SELECT id, number, label, created_at, updated_at
FROM boxes
WHERE number = ?;
`,
      number
    );

    return row ? toBox(row) : null;
  }
}

function toBox(row: BoxRow): Box {
  return {
    id: row.id,
    number: row.number,
    label: row.label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
