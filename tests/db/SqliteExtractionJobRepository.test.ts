import { describe, expect, it } from 'vitest';

import { SqliteExtractionJobRepository, type SqliteDatabase } from '../../src/db';
import type { ExtractionJobStatus, ExtractionMode, ItemSuggestionStatus } from '../../src/domain';

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

class FakeSqliteExtractionDatabase implements SqliteDatabase {
  jobs: ExtractionJobRow[] = [];
  suggestions: ItemSuggestionRow[] = [];

  async runAsync(sql: string, ...params: unknown[]): Promise<unknown> {
    if (sql.includes('INSERT INTO extraction_jobs')) {
      const [id, boxId, photoIdsJson, mode, createdAt, updatedAt] = params;
      this.jobs.push({
        id: String(id),
        box_id: String(boxId),
        photo_ids_json: String(photoIdsJson),
        mode: mode as ExtractionMode,
        status: 'pending',
        error_message: null,
        created_at: String(createdAt),
        updated_at: String(updatedAt)
      });
    }

    if (sql.includes('INSERT INTO item_suggestions')) {
      const [
        id,
        jobId,
        name,
        attributesJson,
        sourcePhotoIdsJson,
        reason,
        selectedByDefault,
        status,
        createdAt,
        updatedAt
      ] = params;
      this.suggestions.push({
        id: String(id),
        job_id: String(jobId),
        name: String(name),
        attributes_json: String(attributesJson),
        source_photo_ids_json: String(sourcePhotoIdsJson),
        reason: reason === null ? null : String(reason),
        selected_by_default: Number(selectedByDefault),
        status: status as ItemSuggestionStatus,
        created_at: String(createdAt),
        updated_at: String(updatedAt)
      });
    }

    if (sql.includes("SET status = 'needs_review'")) {
      const [updatedAt, id] = params;
      this.jobs = this.jobs.map((job) =>
        job.id === id
          ? { ...job, status: 'needs_review', error_message: null, updated_at: String(updatedAt) }
          : job
      );
    }

    if (sql.includes("SET status = 'failed'")) {
      const [errorMessage, updatedAt, id] = params;
      this.jobs = this.jobs.map((job) =>
        job.id === id
          ? { ...job, status: 'failed', error_message: String(errorMessage), updated_at: String(updatedAt) }
          : job
      );
    }

    return undefined;
  }

  async getFirstAsync<T>(_sql: string, ...params: unknown[]): Promise<T | null> {
    const [id] = params;
    return (this.jobs.find((job) => job.id === id) as T | undefined) ?? null;
  }

  async getAllAsync<T>(_sql: string, ...params: unknown[]): Promise<T[]> {
    const [jobId] = params;
    return this.suggestions.filter((suggestion) => suggestion.job_id === jobId) as T[];
  }
}

describe('SqliteExtractionJobRepository', () => {
  it('creates a pending job, saves suggestions, and marks it for review', async () => {
    const repository = new SqliteExtractionJobRepository(new FakeSqliteExtractionDatabase());

    await repository.create({
      id: 'job-1',
      boxId: 'box-1',
      photoIds: ['photo-1', 'photo-2'],
      mode: 'mock',
      createdAt: '2026-06-30T10:00:00.000Z',
      updatedAt: '2026-06-30T10:00:00.000Z'
    });
    await repository.saveSuggestions('job-1', [
      {
        id: 'suggestion-1',
        jobId: 'job-1',
        name: 'black gloves',
        attributes: { color: 'black' },
        sourcePhotoIds: ['photo-1'],
        selectedByDefault: true,
        status: 'active',
        createdAt: '2026-06-30T10:00:01.000Z',
        updatedAt: '2026-06-30T10:00:01.000Z'
      }
    ]);

    await expect(repository.markNeedsReview('job-1', '2026-06-30T10:00:02.000Z')).resolves.toMatchObject({
      id: 'job-1',
      status: 'needs_review',
      photoIds: ['photo-1', 'photo-2']
    });
    await expect(repository.listSuggestions('job-1')).resolves.toMatchObject([
      {
        id: 'suggestion-1',
        jobId: 'job-1',
        name: 'black gloves',
        attributes: { color: 'black' },
        sourcePhotoIds: ['photo-1'],
        selectedByDefault: true,
        status: 'active'
      }
    ]);
  });

  it('marks a job as failed with an error message', async () => {
    const repository = new SqliteExtractionJobRepository(new FakeSqliteExtractionDatabase());
    await repository.create({
      id: 'job-1',
      boxId: 'box-1',
      photoIds: ['photo-1'],
      mode: 'mock',
      createdAt: '2026-06-30T10:00:00.000Z',
      updatedAt: '2026-06-30T10:00:00.000Z'
    });

    await expect(
      repository.markFailed('job-1', 'model timeout', '2026-06-30T10:00:02.000Z')
    ).resolves.toMatchObject({
      id: 'job-1',
      status: 'failed',
      errorMessage: 'model timeout'
    });
  });
});
