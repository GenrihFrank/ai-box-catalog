import { describe, expect, it } from 'vitest';

import {
  applyItemSuggestions,
  type CreateItemInput,
  type ExtractionJob,
  type ExtractionJobRepository,
  type Item,
  type ItemRepository,
  type ItemSuggestion
} from '../../src/domain';

class FakeItemRepository implements ItemRepository {
  items: Item[] = [];

  async create(input: CreateItemInput): Promise<Item> {
    const item: Item = {
      id: input.id,
      boxId: input.boxId,
      name: input.name,
      aliases: input.aliases ?? [],
      attributes: input.attributes ?? {},
      source: input.source,
      sourceSuggestionId: input.sourceSuggestionId,
      sourcePhotoIds: input.sourcePhotoIds ?? [],
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
    this.items.push(item);
    return item;
  }

  async listByBoxId(boxId: string): Promise<Item[]> {
    return this.items.filter((item) => item.boxId === boxId && !item.deletedAt);
  }

  async listConfirmed(): Promise<Item[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findBySourceSuggestionId(sourceSuggestionId: string): Promise<Item | null> {
    return this.items.find((item) => item.sourceSuggestionId === sourceSuggestionId && !item.deletedAt) ?? null;
  }

  async markDeleted(id: string, deletedAt: string): Promise<void> {
    this.items = this.items.map((item) => (item.id === id ? { ...item, deletedAt } : item));
  }
}

class FakeExtractionJobRepository implements ExtractionJobRepository {
  job: ExtractionJob = {
    id: 'job-1',
    boxId: 'box-1',
    photoIds: ['photo-1'],
    mode: 'mock',
    status: 'needs_review',
    createdAt: '2026-06-30T10:00:00.000Z',
    updatedAt: '2026-06-30T10:00:00.000Z'
  };
  suggestions: ItemSuggestion[] = [
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
  ];

  async create() {
    return this.job;
  }

  async findById() {
    return this.job;
  }

  async findSuggestionById(id: string) {
    return this.suggestions.find((suggestion) => suggestion.id === id) ?? null;
  }

  async listSuggestions() {
    return this.suggestions;
  }

  async saveSuggestions() {}

  async markNeedsReview(_id: string, updatedAt: string) {
    this.job = { ...this.job, status: 'needs_review', updatedAt };
    return this.job;
  }

  async markFailed(_id: string, errorMessage: string, updatedAt: string) {
    this.job = { ...this.job, status: 'failed', errorMessage, updatedAt };
    return this.job;
  }

  async markApplied(_id: string, updatedAt: string) {
    this.job = { ...this.job, status: 'applied', updatedAt };
    return this.job;
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

  private updateSuggestion(id: string, changes: Partial<ItemSuggestion>) {
    const suggestion = this.suggestions.find((candidate) => candidate.id === id);

    if (!suggestion) {
      throw new Error(`Suggestion ${id} does not exist`);
    }

    Object.assign(suggestion, changes);
    return suggestion;
  }
}

describe('applyItemSuggestions', () => {
  it('applies selected suggestions idempotently', async () => {
    const extractionJobRepository = new FakeExtractionJobRepository();
    const itemRepository = new FakeItemRepository();

    await applyItemSuggestions(
      { jobId: 'job-1', suggestionIds: ['suggestion-1'] },
      {
        extractionJobRepository,
        itemRepository,
        createId: () => 'item-1',
        now: () => '2026-06-30T10:00:02.000Z'
      }
    );
    await applyItemSuggestions(
      { jobId: 'job-1', suggestionIds: ['suggestion-1'] },
      {
        extractionJobRepository,
        itemRepository,
        createId: () => 'item-duplicate',
        now: () => '2026-06-30T10:00:03.000Z'
      }
    );

    expect(itemRepository.items).toHaveLength(1);
    expect(itemRepository.items[0]).toMatchObject({
      id: 'item-1',
      boxId: 'box-1',
      name: 'black gloves',
      source: 'ai_confirmed',
      sourceSuggestionId: 'suggestion-1',
      sourcePhotoIds: ['photo-1']
    });
    expect(extractionJobRepository.suggestions[0].status).toBe('applied');
    expect(extractionJobRepository.job.status).toBe('applied');
  });
});
