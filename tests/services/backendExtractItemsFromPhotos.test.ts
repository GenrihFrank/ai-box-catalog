import { describe, expect, it } from 'vitest';

import { createBackendExtractItemsFromPhotos } from '../../src/services/extraction/backendExtractItemsFromPhotos';

describe('createBackendExtractItemsFromPhotos', () => {
  it('posts extraction request to backend endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const adapter = createBackendExtractItemsFromPhotos({
      baseUrl: 'http://127.0.0.1:3001/',
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({
            suggestions: [
              {
                id: 'suggestion-1',
                name: 'black gloves',
                sourcePhotoIds: ['photo-1'],
                selectedByDefault: true
              }
            ]
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
    });

    await expect(
      adapter({ boxId: 'box-1', photoIds: ['photo-1'], mode: 'local-desktop-vlm' })
    ).resolves.toMatchObject({
      suggestions: [
        {
          id: 'suggestion-1',
          name: 'black gloves',
          sourcePhotoIds: ['photo-1'],
          selectedByDefault: true
        }
      ]
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://127.0.0.1:3001/api/extract-items');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      boxId: 'box-1',
      photoIds: ['photo-1'],
      mode: 'local-desktop-vlm'
    });
  });

  it('rejects invalid backend response', async () => {
    const adapter = createBackendExtractItemsFromPhotos({
      baseUrl: 'http://127.0.0.1:3001',
      fetchImpl: async () => new Response(JSON.stringify({ suggestions: [{ name: '' }] }), { status: 200 })
    });

    await expect(
      adapter({ boxId: 'box-1', photoIds: ['photo-1'], mode: 'local-desktop-vlm' })
    ).rejects.toThrow();
  });

  it('surfaces backend http errors', async () => {
    const adapter = createBackendExtractItemsFromPhotos({
      baseUrl: 'http://127.0.0.1:3001',
      fetchImpl: async () => new Response('missing local model', { status: 501 })
    });

    await expect(
      adapter({ boxId: 'box-1', photoIds: ['photo-1'], mode: 'local-desktop-vlm' })
    ).rejects.toThrow('Extraction backend failed with status 501');
  });
});
