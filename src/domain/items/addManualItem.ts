import type { Item } from './Item';
import type { ItemRepository } from './ItemRepository';

export type AddManualItemCommand = {
  boxId: string;
  name: string;
};

export type AddManualItemDeps = {
  itemRepository: ItemRepository;
  createId?: () => string;
  now?: () => string;
};

export class EmptyItemNameError extends Error {
  constructor() {
    super('Item name must not be empty');
    this.name = 'EmptyItemNameError';
  }
}

export async function addManualItem(command: AddManualItemCommand, deps: AddManualItemDeps): Promise<Item> {
  const name = command.name.trim();

  if (!name) {
    throw new EmptyItemNameError();
  }

  const timestamp = (deps.now ?? defaultNow)();

  return deps.itemRepository.create({
    id: (deps.createId ?? defaultCreateId)(),
    boxId: command.boxId,
    name,
    source: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
