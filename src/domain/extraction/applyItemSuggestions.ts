import type { Item, ItemRepository } from '../items';
import type { ItemSuggestion } from './ExtractionJob';
import type { ExtractionJobRepository } from './ExtractionJobRepository';

export type ApplyItemSuggestionsCommand = {
  jobId: string;
  suggestionIds: string[];
};

export type ApplyItemSuggestionsDeps = {
  extractionJobRepository: ExtractionJobRepository;
  itemRepository: ItemRepository;
  createId?: () => string;
  now?: () => string;
};

export async function applyItemSuggestions(
  command: ApplyItemSuggestionsCommand,
  deps: ApplyItemSuggestionsDeps
): Promise<Item[]> {
  const selectedIds = new Set(command.suggestionIds);
  const suggestions = (await deps.extractionJobRepository.listSuggestions(command.jobId)).filter((suggestion) =>
    selectedIds.has(suggestion.id)
  );
  const timestamp = (deps.now ?? defaultNow)();
  const boxId = await requireJobBoxId(command.jobId, deps.extractionJobRepository);
  const appliedItems: Item[] = [];

  for (const suggestion of suggestions) {
    if (!canApplySuggestion(suggestion)) {
      continue;
    }

    const existingItem = await deps.itemRepository.findBySourceSuggestionId(suggestion.id);

    if (existingItem) {
      appliedItems.push(existingItem);
      await deps.extractionJobRepository.markSuggestionApplied(suggestion.id, timestamp);
      continue;
    }

    const item = await deps.itemRepository.create({
      id: (deps.createId ?? defaultCreateId)(),
      boxId,
      name: suggestion.name,
      attributes: suggestion.attributes,
      source: 'ai_confirmed',
      sourceSuggestionId: suggestion.id,
      sourcePhotoIds: suggestion.sourcePhotoIds,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    appliedItems.push(item);
    await deps.extractionJobRepository.markSuggestionApplied(suggestion.id, timestamp);
  }

  await deps.extractionJobRepository.markApplied(command.jobId, timestamp);
  return appliedItems;
}

function canApplySuggestion(suggestion: ItemSuggestion): boolean {
  return suggestion.status === 'active' || suggestion.status === 'edited' || suggestion.status === 'applied';
}

async function requireJobBoxId(jobId: string, extractionJobRepository: ExtractionJobRepository): Promise<string> {
  const job = await extractionJobRepository.findById(jobId);

  if (!job) {
    throw new Error(`Extraction job ${jobId} does not exist`);
  }

  return job.boxId;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
