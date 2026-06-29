import type { Item } from '../items';

export type SearchMatchedItem = {
  itemId: string;
  name: string;
  matchedTerms: string[];
  sourcePhotoIds: string[];
};

export type SearchResult = {
  boxId: string;
  score: number;
  matchedItems: SearchMatchedItem[];
};

export function searchItems(query: string, items: Item[]): SearchResult[] {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const resultsByBox = new Map<string, SearchResult>();

  for (const item of items) {
    const match = scoreItem(normalizedQuery, queryTokens, item);

    if (match.score === 0) {
      continue;
    }

    const existingResult = resultsByBox.get(item.boxId);
    const matchedItem: SearchMatchedItem = {
      itemId: item.id,
      name: item.name,
      matchedTerms: [...match.matchedTerms],
      sourcePhotoIds: item.sourcePhotoIds
    };

    if (existingResult) {
      existingResult.score += match.score;
      existingResult.matchedItems.push(matchedItem);
    } else {
      resultsByBox.set(item.boxId, {
        boxId: item.boxId,
        score: match.score,
        matchedItems: [matchedItem]
      });
    }
  }

  return [...resultsByBox.values()].sort((a, b) => b.score - a.score);
}

function scoreItem(
  normalizedQuery: string,
  queryTokens: string[],
  item: Item
): { score: number; matchedTerms: Set<string> } {
  const matchedTerms = new Set<string>();
  const searchableFields = [
    item.name,
    ...item.aliases,
    ...Object.values(item.attributes).filter((value): value is string => Boolean(value))
  ].map(normalizeText);
  const searchableText = searchableFields.join(' ');
  let score = 0;

  if (searchableText.includes(normalizedQuery)) {
    score += 10;
    matchedTerms.add(normalizedQuery);
  }

  for (const token of queryTokens) {
    if (searchableFields.some((field) => tokenize(field).includes(token))) {
      score += 2;
      matchedTerms.add(token);
    }
  }

  return { score, matchedTerms };
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase().trim().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ');
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean);
}
