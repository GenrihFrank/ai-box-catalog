import { describe, expect, it } from 'vitest';

import { SqliteBoxRepository, type SqliteBoxDatabase } from '../../src/db';

class FakeSqliteBoxDatabase implements SqliteBoxDatabase {
  rows: Array<{
    id: string;
    number: number;
    label: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  async runAsync(_sql: string, ...params: unknown[]): Promise<unknown> {
    const [id, number, label, createdAt, updatedAt] = params;
    this.rows.push({
      id: String(id),
      number: Number(number),
      label: label === null ? null : String(label),
      created_at: String(createdAt),
      updated_at: String(updatedAt)
    });
    return undefined;
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const [value] = params;
    const row = sql.includes('WHERE id = ?')
      ? this.rows.find((candidate) => candidate.id === value)
      : this.rows.find((candidate) => candidate.number === value);

    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(): Promise<T[]> {
    return [...this.rows].sort((a, b) => a.number - b.number) as T[];
  }
}

describe('SqliteBoxRepository', () => {
  it('creates and lists boxes ordered by number', async () => {
    const repository = new SqliteBoxRepository(new FakeSqliteBoxDatabase());

    await repository.create({
      id: 'box-2',
      number: 2,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });
    await repository.create({
      id: 'box-1',
      number: 1,
      label: 'First box',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    await expect(repository.list()).resolves.toEqual([
      {
        id: 'box-1',
        number: 1,
        label: 'First box',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z'
      },
      {
        id: 'box-2',
        number: 2,
        label: undefined,
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z'
      }
    ]);
  });

  it('finds box by id and number', async () => {
    const repository = new SqliteBoxRepository(new FakeSqliteBoxDatabase());
    await repository.create({
      id: 'box-1',
      number: 1,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    await expect(repository.findById('box-1')).resolves.toMatchObject({ id: 'box-1' });
    await expect(repository.findByNumber(1)).resolves.toMatchObject({ number: 1 });
    await expect(repository.findById('missing')).resolves.toBeNull();
  });
});
