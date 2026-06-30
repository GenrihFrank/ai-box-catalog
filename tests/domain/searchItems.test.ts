import { describe, expect, it } from 'vitest';

import { searchItems, type Item } from '../../src/domain';

const baseItem = {
  aliases: [],
  attributes: {},
  source: 'manual',
  sourcePhotoIds: [],
  createdAt: '2026-06-29T00:00:00.000Z',
  updatedAt: '2026-06-29T00:00:00.000Z'
} satisfies Omit<Item, 'id' | 'boxId' | 'name'>;

describe('searchItems', () => {
  it('finds exact phrase matches grouped by box', () => {
    const results = searchItems('black gloves', [
      { ...baseItem, id: 'item-1', boxId: 'box-1', name: 'black gloves' }
    ]);

    expect(results).toEqual([
      {
        boxId: 'box-1',
        score: 14,
        matchedItems: [
          {
            itemId: 'item-1',
            name: 'black gloves',
            matchedTerms: ['black gloves', 'black', 'gloves'],
            sourcePhotoIds: []
          }
        ]
      }
    ]);
  });

  it('ranks stronger matches before weak token matches', () => {
    const results = searchItems('black gloves', [
      { ...baseItem, id: 'item-1', boxId: 'box-1', name: 'black gloves' },
      { ...baseItem, id: 'item-2', boxId: 'box-2', name: 'winter gloves' }
    ]);

    expect(results.map((result) => result.boxId)).toEqual(['box-1', 'box-2']);
  });

  it('matches aliases and attributes', () => {
    const results = searchItems('red dress', [
      {
        ...baseItem,
        id: 'item-1',
        boxId: 'box-1',
        name: 'party outfit',
        aliases: ['dress'],
        attributes: { color: 'red' }
      }
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].matchedItems[0].matchedTerms).toEqual(['red', 'dress']);
  });

  it('keeps source photo evidence for matched AI-confirmed items', () => {
    const results = searchItems('черные перчатки', [
      {
        ...baseItem,
        id: 'item-1',
        boxId: 'box-1',
        name: 'перчатки',
        attributes: { color: 'черные' },
        source: 'ai_confirmed',
        sourcePhotoIds: ['photo-1']
      }
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      boxId: 'box-1',
      matchedItems: [
        {
          itemId: 'item-1',
          matchedTerms: ['черные', 'перчатки'],
          sourcePhotoIds: ['photo-1']
        }
      ]
    });
  });

  it('returns multiple weak matches as candidates', () => {
    const results = searchItems('winter gloves', [
      { ...baseItem, id: 'item-1', boxId: 'box-1', name: 'winter scarf' },
      { ...baseItem, id: 'item-2', boxId: 'box-2', name: 'leather gloves' }
    ]);

    expect(results.map((result) => result.boxId)).toEqual(['box-1', 'box-2']);
    expect(results.every((result) => result.score > 0)).toBe(true);
  });

  it('returns no results for empty or missing query', () => {
    const items = [{ ...baseItem, id: 'item-1', boxId: 'box-1', name: 'black gloves' }];

    expect(searchItems('', items)).toEqual([]);
    expect(searchItems('red dress', items)).toEqual([]);
  });
});
