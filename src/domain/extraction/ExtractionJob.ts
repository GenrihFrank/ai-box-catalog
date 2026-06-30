import type { ItemAttributes } from '../items';
import type { ExtractionMode } from '../../shared/extractionContract';

export type { ExtractionMode };

export type ExtractionJobStatus = 'pending' | 'running' | 'needs_review' | 'failed' | 'applied';

export type ItemSuggestionStatus = 'active' | 'edited' | 'deleted' | 'applied';

export type ExtractionJob = {
  id: string;
  boxId: string;
  photoIds: string[];
  mode: ExtractionMode;
  status: ExtractionJobStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemSuggestion = {
  id: string;
  jobId: string;
  name: string;
  attributes: ItemAttributes;
  sourcePhotoIds: string[];
  reason?: string;
  selectedByDefault: boolean;
  status: ItemSuggestionStatus;
  createdAt: string;
  updatedAt: string;
};
