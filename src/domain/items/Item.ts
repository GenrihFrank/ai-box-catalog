export type ItemAttributes = {
  color?: string;
  category?: string;
  season?: string;
  material?: string;
};

export type ItemSource = 'manual' | 'ai_confirmed';

export type Item = {
  id: string;
  boxId: string;
  name: string;
  aliases: string[];
  attributes: ItemAttributes;
  source: ItemSource;
  sourceSuggestionId?: string;
  sourcePhotoIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};
