import { describe, expect, it } from 'vitest';

import { SqliteBoxPhotoRepository, type SqliteDatabase } from '../../src/db';

type BoxPhotoRow = {
  id: string;
  box_id: string;
  local_uri: string;
  thumbnail_uri: string;
  width: number;
  height: number;
  byte_size: number;
  taken_at: string | null;
  created_at: string;
};

class FakeSqliteBoxPhotoDatabase implements SqliteDatabase {
  rows: BoxPhotoRow[] = [];

  async runAsync(sql: string, ...params: unknown[]): Promise<unknown> {
    if (sql.includes('INSERT INTO box_photos')) {
      const [id, boxId, localUri, thumbnailUri, width, height, byteSize, takenAt, createdAt] = params;

      this.rows.push({
        id: String(id),
        box_id: String(boxId),
        local_uri: String(localUri),
        thumbnail_uri: String(thumbnailUri),
        width: Number(width),
        height: Number(height),
        byte_size: Number(byteSize),
        taken_at: takenAt === null ? null : String(takenAt),
        created_at: String(createdAt)
      });
    }

    return undefined;
  }

  async getFirstAsync<T>(_sql: string, ...params: unknown[]): Promise<T | null> {
    const [id] = params;
    return (this.rows.find((row) => row.id === id) as T | undefined) ?? null;
  }

  async getAllAsync<T>(_sql: string, ...params: unknown[]): Promise<T[]> {
    const [boxId] = params;
    return this.rows.filter((row) => row.box_id === boxId) as T[];
  }
}

describe('SqliteBoxPhotoRepository', () => {
  it('creates and lists photos by box', async () => {
    const repository = new SqliteBoxPhotoRepository(new FakeSqliteBoxPhotoDatabase());

    await repository.create({
      id: 'photo-1',
      boxId: 'box-1',
      localUri: 'file:///photos/photo-1.jpg',
      thumbnailUri: 'file:///photos/photo-1-thumb.jpg',
      width: 1280,
      height: 960,
      byteSize: 120000,
      takenAt: '2026-06-29T10:00:00.000Z',
      createdAt: '2026-06-29T10:00:01.000Z'
    });

    await expect(repository.listByBoxId('box-1')).resolves.toMatchObject([
      {
        id: 'photo-1',
        boxId: 'box-1',
        localUri: 'file:///photos/photo-1.jpg',
        thumbnailUri: 'file:///photos/photo-1-thumb.jpg',
        width: 1280,
        height: 960,
        byteSize: 120000,
        takenAt: '2026-06-29T10:00:00.000Z'
      }
    ]);
  });

  it('finds a photo by stable id', async () => {
    const repository = new SqliteBoxPhotoRepository(new FakeSqliteBoxPhotoDatabase());
    await repository.create({
      id: 'photo-1',
      boxId: 'box-1',
      localUri: 'file:///photos/photo-1.jpg',
      thumbnailUri: 'file:///photos/photo-1-thumb.jpg',
      width: 1280,
      height: 960,
      byteSize: 120000,
      createdAt: '2026-06-29T10:00:01.000Z'
    });

    await expect(repository.findById('photo-1')).resolves.toMatchObject({
      id: 'photo-1',
      boxId: 'box-1'
    });
  });
});
