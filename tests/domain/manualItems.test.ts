import { describe, expect, it } from 'vitest';

import {
  addManualItem,
  deleteItem,
  EmptyItemNameError,
  type CreateItemInput,
  type Item,
  type ItemRepository
} from '../../src/domain';

class InMemoryItemRepository implements ItemRepository {
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

  async markDeleted(id: string, deletedAt: string): Promise<void> {
    this.items = this.items.map((item) => (item.id === id ? { ...item, deletedAt } : item));
  }
}

describe('manual items', () => {
  it('adds manual item with trimmed name', async () => {
    const repository = new InMemoryItemRepository();

    const item = await addManualItem(
      { boxId: 'box-1', name: '  black gloves  ' },
      {
        itemRepository: repository,
        createId: () => 'item-1',
        now: () => '2026-06-29T00:00:00.000Z'
      }
    );

    expect(item).toMatchObject({
      id: 'item-1',
      boxId: 'box-1',
      name: 'black gloves',
      source: 'manual'
    });
  });

  it('rejects empty item name', async () => {
    const repository = new InMemoryItemRepository();

    await expect(
      addManualItem(
        { boxId: 'box-1', name: '   ' },
        {
          itemRepository: repository,
          createId: () => 'item-1',
          now: () => '2026-06-29T00:00:00.000Z'
        }
      )
    ).rejects.toBeInstanceOf(EmptyItemNameError);
  });

  it('deleted item disappears from active box list', async () => {
    const repository = new InMemoryItemRepository();
    const item = await addManualItem(
      { boxId: 'box-1', name: 'black gloves' },
      {
        itemRepository: repository,
        createId: () => 'item-1',
        now: () => '2026-06-29T00:00:00.000Z'
      }
    );

    await deleteItem(
      { id: item.id },
      {
        itemRepository: repository,
        now: () => '2026-06-29T01:00:00.000Z'
      }
    );

    await expect(repository.listByBoxId('box-1')).resolves.toEqual([]);
  });
});
