import type {
  CreateExtractionJobInput,
  ExtractionJob,
  ExtractionJobRepository,
  ExtractionJobStatus,
  ItemSuggestion,
  ItemSuggestionStatus
} from '../../domain/extraction';
import type { ExtractionMode } from '../../shared/extractionContract';
import type { ItemAttributes } from '../../domain/items';
import type { SqliteDatabase } from '../SqliteDatabase';

type ExtractionJobRow = {
  id: string;
  box_id: string;
  photo_ids_json: string;
  mode: ExtractionMode;
  status: ExtractionJobStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ItemSuggestionRow = {
  id: string;
  job_id: string;
  name: string;
  attributes_json: string;
  source_photo_ids_json: string;
  reason: string | null;
  selected_by_default: number;
  status: ItemSuggestionStatus;
  created_at: string;
  updated_at: string;
};

export class SqliteExtractionJobRepository implements ExtractionJobRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(input: CreateExtractionJobInput): Promise<ExtractionJob> {
    await this.db.runAsync(
      `
INSERT INTO extraction_jobs (
  id,
  box_id,
  photo_ids_json,
  mode,
  status,
  created_at,
  updated_at
)
VALUES (?, ?, ?, ?, 'pending', ?, ?);
`,
      input.id,
      input.boxId,
      JSON.stringify(input.photoIds),
      input.mode,
      input.createdAt,
      input.updatedAt
    );

    return {
      id: input.id,
      boxId: input.boxId,
      photoIds: input.photoIds,
      mode: input.mode,
      status: 'pending',
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
  }

  async findById(id: string): Promise<ExtractionJob | null> {
    const row = await this.db.getFirstAsync<ExtractionJobRow>(
      `
SELECT id, box_id, photo_ids_json, mode, status, error_message, created_at, updated_at
FROM extraction_jobs
WHERE id = ?;
`,
      id
    );

    return row ? toExtractionJob(row) : null;
  }

  async listSuggestions(jobId: string): Promise<ItemSuggestion[]> {
    const rows = await this.db.getAllAsync<ItemSuggestionRow>(
      `
SELECT id, job_id, name, attributes_json, source_photo_ids_json, reason,
  selected_by_default, status, created_at, updated_at
FROM item_suggestions
WHERE job_id = ?
ORDER BY created_at ASC;
`,
      jobId
    );

    return rows.map(toItemSuggestion);
  }

  async saveSuggestions(_jobId: string, suggestions: ItemSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      await this.db.runAsync(
        `
INSERT INTO item_suggestions (
  id,
  job_id,
  name,
  attributes_json,
  source_photo_ids_json,
  reason,
  selected_by_default,
  status,
  created_at,
  updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`,
        suggestion.id,
        suggestion.jobId,
        suggestion.name,
        JSON.stringify(suggestion.attributes),
        JSON.stringify(suggestion.sourcePhotoIds),
        suggestion.reason ?? null,
        suggestion.selectedByDefault ? 1 : 0,
        suggestion.status,
        suggestion.createdAt,
        suggestion.updatedAt
      );
    }
  }

  async markNeedsReview(id: string, updatedAt: string): Promise<ExtractionJob> {
    await this.db.runAsync(
      `
UPDATE extraction_jobs
SET status = 'needs_review', error_message = NULL, updated_at = ?
WHERE id = ?;
`,
      updatedAt,
      id
    );

    return this.requireJob(id);
  }

  async markFailed(id: string, errorMessage: string, updatedAt: string): Promise<ExtractionJob> {
    await this.db.runAsync(
      `
UPDATE extraction_jobs
SET status = 'failed', error_message = ?, updated_at = ?
WHERE id = ?;
`,
      errorMessage,
      updatedAt,
      id
    );

    return this.requireJob(id);
  }

  private async requireJob(id: string): Promise<ExtractionJob> {
    const job = await this.findById(id);

    if (!job) {
      throw new Error(`Extraction job ${id} does not exist`);
    }

    return job;
  }
}

function toExtractionJob(row: ExtractionJobRow): ExtractionJob {
  return {
    id: row.id,
    boxId: row.box_id,
    photoIds: JSON.parse(row.photo_ids_json) as string[],
    mode: row.mode,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toItemSuggestion(row: ItemSuggestionRow): ItemSuggestion {
  return {
    id: row.id,
    jobId: row.job_id,
    name: row.name,
    attributes: JSON.parse(row.attributes_json) as ItemAttributes,
    sourcePhotoIds: JSON.parse(row.source_photo_ids_json) as string[],
    reason: row.reason ?? undefined,
    selectedByDefault: row.selected_by_default === 1,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
