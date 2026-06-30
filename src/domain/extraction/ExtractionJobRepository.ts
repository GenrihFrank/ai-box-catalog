import type { ExtractionJob, ExtractionMode, ItemSuggestion } from './ExtractionJob';

export type CreateExtractionJobInput = {
  id: string;
  boxId: string;
  photoIds: string[];
  mode: ExtractionMode;
  createdAt: string;
  updatedAt: string;
};

export type ExtractionJobRepository = {
  create(input: CreateExtractionJobInput): Promise<ExtractionJob>;
  findById(id: string): Promise<ExtractionJob | null>;
  findSuggestionById(id: string): Promise<ItemSuggestion | null>;
  listSuggestions(jobId: string): Promise<ItemSuggestion[]>;
  saveSuggestions(jobId: string, suggestions: ItemSuggestion[]): Promise<void>;
  markNeedsReview(id: string, updatedAt: string): Promise<ExtractionJob>;
  markFailed(id: string, errorMessage: string, updatedAt: string): Promise<ExtractionJob>;
  markApplied(id: string, updatedAt: string): Promise<ExtractionJob>;
  updateSuggestionName(id: string, name: string, updatedAt: string): Promise<ItemSuggestion>;
  markSuggestionDeleted(id: string, updatedAt: string): Promise<ItemSuggestion>;
  markSuggestionApplied(id: string, updatedAt: string): Promise<ItemSuggestion>;
};
