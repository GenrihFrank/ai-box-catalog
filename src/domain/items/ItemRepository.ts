import type { Item, ItemAttributes, ItemSource } from './Item';

export type CreateItemInput = {
  id: string;
  boxId: string;
  name: string;
  aliases?: string[];
  attributes?: ItemAttributes;
  source: ItemSource;
  sourceSuggestionId?: string;
  sourcePhotoIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ItemRepository = {
  create(input: CreateItemInput): Promise<Item>;
  listByBoxId(boxId: string): Promise<Item[]>;
  listConfirmed(): Promise<Item[]>;
  markDeleted(id: string, deletedAt: string): Promise<void>;
};
