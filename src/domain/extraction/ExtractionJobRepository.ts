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
  listSuggestions(jobId: string): Promise<ItemSuggestion[]>;
  saveSuggestions(jobId: string, suggestions: ItemSuggestion[]): Promise<void>;
};
