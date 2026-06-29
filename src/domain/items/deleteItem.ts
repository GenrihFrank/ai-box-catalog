import type { ItemRepository } from './ItemRepository';

export type DeleteItemCommand = {
  id: string;
};

export type DeleteItemDeps = {
  itemRepository: ItemRepository;
  now?: () => string;
};

export async function deleteItem(command: DeleteItemCommand, deps: DeleteItemDeps): Promise<void> {
  await deps.itemRepository.markDeleted(command.id, (deps.now ?? defaultNow)());
}

function defaultNow(): string {
  return new Date().toISOString();
}
