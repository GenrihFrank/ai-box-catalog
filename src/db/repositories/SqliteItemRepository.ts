import type { CreateItemInput, Item, ItemRepository, ItemAttributes, ItemSource } from '../../domain/items';
import type { SqliteDatabase } from '../SqliteDatabase';

type ItemRow = {
  id: string;
  box_id: string;
  name: string;
  aliases_json: string;
  attributes_json: string;
  source: ItemSource;
  source_suggestion_id: string | null;
  source_photo_ids_json: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class SqliteItemRepository implements ItemRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(input: CreateItemInput): Promise<Item> {
    const aliases = input.aliases ?? [];
    const attributes = input.attributes ?? {};
    const sourcePhotoIds = input.sourcePhotoIds ?? [];

    await this.db.runAsync(
      `
INSERT INTO items (
  id,
  box_id,
  name,
  aliases_json,
  attributes_json,
  source,
  source_suggestion_id,
  source_photo_ids_json,
  created_at,
  updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`,
      input.id,
      input.boxId,
      input.name,
      JSON.stringify(aliases),
      JSON.stringify(attributes),
      input.source,
      input.sourceSuggestionId ?? null,
      JSON.stringify(sourcePhotoIds),
      input.createdAt,
      input.updatedAt
    );

    return {
      id: input.id,
      boxId: input.boxId,
      name: input.name,
      aliases,
      attributes,
      source: input.source,
      sourceSuggestionId: input.sourceSuggestionId,
      sourcePhotoIds,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
  }

  async listByBoxId(boxId: string): Promise<Item[]> {
    const rows = await this.db.getAllAsync<ItemRow>(
      `
SELECT id, box_id, name, aliases_json, attributes_json, source, source_suggestion_id,
  source_photo_ids_json, created_at, updated_at, deleted_at
FROM items
WHERE box_id = ? AND deleted_at IS NULL
ORDER BY created_at ASC;
`,
      boxId
    );

    return rows.map(toItem);
  }

  async listConfirmed(): Promise<Item[]> {
    const rows = await this.db.getAllAsync<ItemRow>(`
SELECT id, box_id, name, aliases_json, attributes_json, source, source_suggestion_id,
  source_photo_ids_json, created_at, updated_at, deleted_at
FROM items
WHERE deleted_at IS NULL
ORDER BY created_at ASC;
`);

    return rows.map(toItem);
  }

  async findBySourceSuggestionId(sourceSuggestionId: string): Promise<Item | null> {
    const row = await this.db.getFirstAsync<ItemRow>(
      `
SELECT id, box_id, name, aliases_json, attributes_json, source, source_suggestion_id,
  source_photo_ids_json, created_at, updated_at, deleted_at
FROM items
WHERE source_suggestion_id = ? AND deleted_at IS NULL;
`,
      sourceSuggestionId
    );

    return row ? toItem(row) : null;
  }

  async markDeleted(id: string, deletedAt: string): Promise<void> {
    await this.db.runAsync(
      `
UPDATE items
SET deleted_at = ?, updated_at = ?
WHERE id = ?;
`,
      deletedAt,
      deletedAt,
      id
    );
  }
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    boxId: row.box_id,
    name: row.name,
    aliases: JSON.parse(row.aliases_json) as string[],
    attributes: JSON.parse(row.attributes_json) as ItemAttributes,
    source: row.source,
    sourceSuggestionId: row.source_suggestion_id ?? undefined,
    sourcePhotoIds: JSON.parse(row.source_photo_ids_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined
  };
}
