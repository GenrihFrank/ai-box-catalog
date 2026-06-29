import { describe, expect, it } from 'vitest';

import { SqliteItemRepository, type SqliteDatabase } from '../../src/db';

type ItemRow = {
  id: string;
  box_id: string;
  name: string;
  aliases_json: string;
  attributes_json: string;
  source: 'manual' | 'ai_confirmed';
  source_suggestion_id: string | null;
  source_photo_ids_json: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

class FakeSqliteItemDatabase implements SqliteDatabase {
  rows: ItemRow[] = [];

  async runAsync(sql: string, ...params: unknown[]): Promise<unknown> {
    if (sql.includes('INSERT INTO items')) {
      const [
        id,
        boxId,
        name,
        aliasesJson,
        attributesJson,
        source,
        sourceSuggestionId,
        sourcePhotoIdsJson,
        createdAt,
        updatedAt
      ] = params;

      this.rows.push({
        id: String(id),
        box_id: String(boxId),
        name: String(name),
        aliases_json: String(aliasesJson),
        attributes_json: String(attributesJson),
        source: source as 'manual' | 'ai_confirmed',
        source_suggestion_id: sourceSuggestionId === null ? null : String(sourceSuggestionId),
        source_photo_ids_json: String(sourcePhotoIdsJson),
        created_at: String(createdAt),
        updated_at: String(updatedAt),
        deleted_at: null
      });
    }

    if (sql.includes('UPDATE items')) {
      const [deletedAt, updatedAt, id] = params;
      this.rows = this.rows.map((row) =>
        row.id === id ? { ...row, deleted_at: String(deletedAt), updated_at: String(updatedAt) } : row
      );
    }

    return undefined;
  }

  async getFirstAsync<T>(): Promise<T | null> {
    return null;
  }

  async getAllAsync<T>(_sql: string, ...params: unknown[]): Promise<T[]> {
    const [boxId] = params;
    const rows = this.rows.filter((row) => !row.deleted_at && (!boxId || row.box_id === boxId));
    return rows as T[];
  }
}

describe('SqliteItemRepository', () => {
  it('creates and lists active items by box', async () => {
    const repository = new SqliteItemRepository(new FakeSqliteItemDatabase());

    await repository.create({
      id: 'item-1',
      boxId: 'box-1',
      name: 'black gloves',
      source: 'manual',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    await expect(repository.listByBoxId('box-1')).resolves.toMatchObject([
      {
        id: 'item-1',
        boxId: 'box-1',
        name: 'black gloves',
        aliases: [],
        attributes: {},
        source: 'manual',
        sourcePhotoIds: []
      }
    ]);
  });

  it('hides deleted items from active lists', async () => {
    const repository = new SqliteItemRepository(new FakeSqliteItemDatabase());
    await repository.create({
      id: 'item-1',
      boxId: 'box-1',
      name: 'black gloves',
      source: 'manual',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    await repository.markDeleted('item-1', '2026-06-29T01:00:00.000Z');

    await expect(repository.listByBoxId('box-1')).resolves.toEqual([]);
    await expect(repository.listConfirmed()).resolves.toEqual([]);
  });
});
