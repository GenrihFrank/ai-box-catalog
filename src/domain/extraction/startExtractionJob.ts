import type {
  ExtractItemsRequest,
  ExtractItemsResponse,
  ExtractedItemSuggestion
} from '../../shared/extractionContract';
import type { BoxPhotoRepository } from '../photos';
import type { ExtractionJob, ItemSuggestion } from './ExtractionJob';
import type { ExtractionJobRepository } from './ExtractionJobRepository';

export type StartExtractionJobCommand = ExtractItemsRequest;

export type ExtractItemsFromPhotos = (request: ExtractItemsRequest) => Promise<ExtractItemsResponse>;

export type StartExtractionJobDeps = {
  boxPhotoRepository: BoxPhotoRepository;
  extractionJobRepository: ExtractionJobRepository;
  extractItemsFromPhotos: ExtractItemsFromPhotos;
  createId?: () => string;
  now?: () => string;
};

export class EmptyPhotoSelectionError extends Error {
  constructor() {
    super('Extraction requires at least one photo');
    this.name = 'EmptyPhotoSelectionError';
  }
}

export class MissingBoxPhotoError extends Error {
  constructor(photoId: string) {
    super(`Photo ${photoId} does not exist`);
    this.name = 'MissingBoxPhotoError';
  }
}

export class MixedBoxPhotosError extends Error {
  constructor() {
    super('Extraction job cannot mix photos from different boxes');
    this.name = 'MixedBoxPhotosError';
  }
}

export class InvalidSuggestionSourcePhotoError extends Error {
  constructor(photoId: string) {
    super(`Suggestion references photo ${photoId} outside the extraction request`);
    this.name = 'InvalidSuggestionSourcePhotoError';
  }
}

export async function startExtractionJob(
  command: StartExtractionJobCommand,
  deps: StartExtractionJobDeps
): Promise<ExtractionJob> {
  const photoIds = Array.from(new Set(command.photoIds));

  if (photoIds.length === 0) {
    throw new EmptyPhotoSelectionError();
  }

  await assertPhotosBelongToBox(command.boxId, photoIds, deps.boxPhotoRepository);

  const createdAt = (deps.now ?? defaultNow)();
  const job = await deps.extractionJobRepository.create({
    id: (deps.createId ?? defaultCreateId)(),
    boxId: command.boxId,
    photoIds,
    mode: command.mode,
    createdAt,
    updatedAt: createdAt
  });

  try {
    const response = await deps.extractItemsFromPhotos({
      boxId: command.boxId,
      photoIds,
      mode: command.mode
    });
    const updatedAt = (deps.now ?? defaultNow)();
    await deps.extractionJobRepository.saveSuggestions(
      job.id,
      response.suggestions.map((suggestion) =>
        toItemSuggestion(suggestion, job.id, photoIds, updatedAt)
      )
    );

    return deps.extractionJobRepository.markNeedsReview(job.id, updatedAt);
  } catch (error) {
    const updatedAt = (deps.now ?? defaultNow)();
    return deps.extractionJobRepository.markFailed(
      job.id,
      error instanceof Error ? error.message : 'Extraction failed',
      updatedAt
    );
  }
}

async function assertPhotosBelongToBox(
  boxId: string,
  photoIds: string[],
  boxPhotoRepository: BoxPhotoRepository
) {
  for (const photoId of photoIds) {
    const photo = await boxPhotoRepository.findById(photoId);

    if (!photo) {
      throw new MissingBoxPhotoError(photoId);
    }

    if (photo.boxId !== boxId) {
      throw new MixedBoxPhotosError();
    }
  }
}

function toItemSuggestion(
  suggestion: ExtractedItemSuggestion,
  jobId: string,
  requestPhotoIds: string[],
  timestamp: string
): ItemSuggestion {
  for (const sourcePhotoId of suggestion.sourcePhotoIds) {
    if (!requestPhotoIds.includes(sourcePhotoId)) {
      throw new InvalidSuggestionSourcePhotoError(sourcePhotoId);
    }
  }

  return {
    id: suggestion.id,
    jobId,
    name: suggestion.name,
    attributes: suggestion.attributes ?? {},
    sourcePhotoIds: suggestion.sourcePhotoIds,
    reason: suggestion.reason,
    selectedByDefault: suggestion.selectedByDefault,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
