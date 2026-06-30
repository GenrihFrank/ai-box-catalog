import { describe, expect, it } from 'vitest';

import {
  MixedBoxPhotosError,
  startExtractionJob,
  type BoxPhoto,
  type BoxPhotoRepository,
  type CreateBoxPhotoInput,
  type CreateExtractionJobInput,
  type ExtractionJob,
  type ExtractionJobRepository,
  type ItemSuggestion
} from '../../src/domain';

class FakeBoxPhotoRepository implements BoxPhotoRepository {
  constructor(readonly photos: BoxPhoto[]) {}

  async create(input: CreateBoxPhotoInput) {
    this.photos.push(input);
    return input;
  }

  async listByBoxId(boxId: string) {
    return this.photos.filter((photo) => photo.boxId === boxId);
  }

  async findById(id: string) {
    return this.photos.find((photo) => photo.id === id) ?? null;
  }
}

class FakeExtractionJobRepository implements ExtractionJobRepository {
  jobs: ExtractionJob[] = [];
  suggestions: ItemSuggestion[] = [];

  async create(input: CreateExtractionJobInput) {
    const job: ExtractionJob = {
      id: input.id,
      boxId: input.boxId,
      photoIds: input.photoIds,
      mode: input.mode,
      status: 'pending',
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
    this.jobs.push(job);
    return job;
  }

  async findById(id: string) {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async findSuggestionById(id: string) {
    return this.suggestions.find((suggestion) => suggestion.id === id) ?? null;
  }

  async listSuggestions(jobId: string) {
    return this.suggestions.filter((suggestion) => suggestion.jobId === jobId);
  }

  async saveSuggestions(_jobId: string, suggestions: ItemSuggestion[]) {
    this.suggestions.push(...suggestions);
  }

  async markNeedsReview(id: string, updatedAt: string) {
    return this.updateJob(id, { status: 'needs_review', errorMessage: undefined, updatedAt });
  }

  async markFailed(id: string, errorMessage: string, updatedAt: string) {
    return this.updateJob(id, { status: 'failed', errorMessage, updatedAt });
  }

  async markApplied(id: string, updatedAt: string) {
    return this.updateJob(id, { status: 'applied', updatedAt });
  }

  async updateSuggestionName(id: string, name: string, updatedAt: string) {
    return this.updateSuggestion(id, { name, status: 'edited', updatedAt });
  }

  async markSuggestionDeleted(id: string, updatedAt: string) {
    return this.updateSuggestion(id, { status: 'deleted', updatedAt });
  }

  async markSuggestionApplied(id: string, updatedAt: string) {
    return this.updateSuggestion(id, { status: 'applied', updatedAt });
  }

  private updateJob(id: string, changes: Partial<ExtractionJob>) {
    const job = this.jobs.find((candidate) => candidate.id === id);

    if (!job) {
      throw new Error(`Job ${id} does not exist`);
    }

    Object.assign(job, changes);
    return job;
  }

  private updateSuggestion(id: string, changes: Partial<ItemSuggestion>) {
    const suggestion = this.suggestions.find((candidate) => candidate.id === id);

    if (!suggestion) {
      throw new Error(`Suggestion ${id} does not exist`);
    }

    Object.assign(suggestion, changes);
    return suggestion;
  }
}

describe('startExtractionJob', () => {
  it('creates a review job for multiple photos from one box', async () => {
    const jobRepository = new FakeExtractionJobRepository();

    const job = await startExtractionJob(
      { boxId: 'box-1', photoIds: ['photo-1', 'photo-2'], mode: 'mock' },
      {
        boxPhotoRepository: new FakeBoxPhotoRepository([
          createPhoto('photo-1', 'box-1'),
          createPhoto('photo-2', 'box-1')
        ]),
        extractionJobRepository: jobRepository,
        extractItemsFromPhotos: async (request) => ({
          suggestions: [
            {
              id: 'suggestion-1',
              name: 'black gloves',
              sourcePhotoIds: request.photoIds,
              selectedByDefault: true
            }
          ]
        }),
        createId: () => 'job-1',
        now: () => '2026-06-30T10:00:00.000Z'
      }
    );

    expect(job).toMatchObject({
      id: 'job-1',
      boxId: 'box-1',
      photoIds: ['photo-1', 'photo-2'],
      status: 'needs_review'
    });
    await expect(jobRepository.listSuggestions('job-1')).resolves.toMatchObject([
      {
        id: 'suggestion-1',
        jobId: 'job-1',
        name: 'black gloves',
        sourcePhotoIds: ['photo-1', 'photo-2'],
        status: 'active'
      }
    ]);
  });

  it('rejects extraction when photos belong to different boxes', async () => {
    const jobRepository = new FakeExtractionJobRepository();
    let adapterCalled = false;

    await expect(
      startExtractionJob(
        { boxId: 'box-1', photoIds: ['photo-1', 'photo-2'], mode: 'mock' },
        {
          boxPhotoRepository: new FakeBoxPhotoRepository([
            createPhoto('photo-1', 'box-1'),
            createPhoto('photo-2', 'box-2')
          ]),
          extractionJobRepository: jobRepository,
          extractItemsFromPhotos: async () => {
            adapterCalled = true;
            return { suggestions: [] };
          }
        }
      )
    ).rejects.toBeInstanceOf(MixedBoxPhotosError);

    expect(adapterCalled).toBe(false);
    expect(jobRepository.jobs).toEqual([]);
  });

  it('marks job as failed when adapter fails without deleting photos', async () => {
    const boxPhotoRepository = new FakeBoxPhotoRepository([createPhoto('photo-1', 'box-1')]);

    const job = await startExtractionJob(
      { boxId: 'box-1', photoIds: ['photo-1'], mode: 'mock' },
      {
        boxPhotoRepository,
        extractionJobRepository: new FakeExtractionJobRepository(),
        extractItemsFromPhotos: async () => {
          throw new Error('model timeout');
        },
        createId: () => 'job-1',
        now: () => '2026-06-30T10:00:00.000Z'
      }
    );

    expect(job).toMatchObject({
      id: 'job-1',
      status: 'failed',
      errorMessage: 'model timeout'
    });
    expect(boxPhotoRepository.photos).toHaveLength(1);
  });
});

function createPhoto(id: string, boxId: string): BoxPhoto {
  return {
    id,
    boxId,
    localUri: `file:///${id}.jpg`,
    thumbnailUri: `file:///${id}-thumb.jpg`,
    width: 1280,
    height: 960,
    byteSize: 120000,
    createdAt: '2026-06-30T09:00:00.000Z'
  };
}
