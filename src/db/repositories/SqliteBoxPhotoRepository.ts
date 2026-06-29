import type { BoxPhoto, BoxPhotoRepository, CreateBoxPhotoInput } from '../../domain/photos';
import type { SqliteDatabase } from '../SqliteDatabase';

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

export class SqliteBoxPhotoRepository implements BoxPhotoRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(input: CreateBoxPhotoInput): Promise<BoxPhoto> {
    await this.db.runAsync(
      `
INSERT INTO box_photos (
  id,
  box_id,
  local_uri,
  thumbnail_uri,
  width,
  height,
  byte_size,
  taken_at,
  created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`,
      input.id,
      input.boxId,
      input.localUri,
      input.thumbnailUri,
      input.width,
      input.height,
      input.byteSize,
      input.takenAt ?? null,
      input.createdAt
    );

    return input;
  }

  async listByBoxId(boxId: string): Promise<BoxPhoto[]> {
    const rows = await this.db.getAllAsync<BoxPhotoRow>(
      `
SELECT id, box_id, local_uri, thumbnail_uri, width, height, byte_size, taken_at, created_at
FROM box_photos
WHERE box_id = ?
ORDER BY created_at ASC;
`,
      boxId
    );

    return rows.map(toBoxPhoto);
  }

  async findById(id: string): Promise<BoxPhoto | null> {
    const row = await this.db.getFirstAsync<BoxPhotoRow>(
      `
SELECT id, box_id, local_uri, thumbnail_uri, width, height, byte_size, taken_at, created_at
FROM box_photos
WHERE id = ?;
`,
      id
    );

    return row ? toBoxPhoto(row) : null;
  }
}

function toBoxPhoto(row: BoxPhotoRow): BoxPhoto {
  return {
    id: row.id,
    boxId: row.box_id,
    localUri: row.local_uri,
    thumbnailUri: row.thumbnail_uri,
    width: row.width,
    height: row.height,
    byteSize: row.byte_size,
    takenAt: row.taken_at ?? undefined,
    createdAt: row.created_at
  };
}
