import { describe, expect, it } from 'vitest';

import { createLocalDesktopVlmExtractItemsFromPhotos } from '../../src/services/extraction/localDesktopVlmExtractItemsFromPhotos';

describe('createLocalDesktopVlmExtractItemsFromPhotos', () => {
  it('posts extraction request to local desktop VLM endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const adapter = createLocalDesktopVlmExtractItemsFromPhotos({
      endpointUrl: 'http://127.0.0.1:8788/extract',
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
    expect(calls[0].url).toBe('http://127.0.0.1:8788/extract');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      boxId: 'box-1',
      photoIds: ['photo-1'],
      mode: 'local-desktop-vlm'
    });
  });

  it('rejects invalid local desktop VLM response', async () => {
    const adapter = createLocalDesktopVlmExtractItemsFromPhotos({
      endpointUrl: 'http://127.0.0.1:8788/extract',
      fetchImpl: async () => new Response(JSON.stringify({ suggestions: [{ name: '' }] }), { status: 200 })
    });

    await expect(
      adapter({ boxId: 'box-1', photoIds: ['photo-1'], mode: 'local-desktop-vlm' })
    ).rejects.toThrow();
  });

  it('surfaces local desktop VLM http errors', async () => {
    const adapter = createLocalDesktopVlmExtractItemsFromPhotos({
      endpointUrl: 'http://127.0.0.1:8788/extract',
      fetchImpl: async () => new Response('bad request', { status: 400 })
    });

    await expect(
      adapter({ boxId: 'box-1', photoIds: ['photo-1'], mode: 'local-desktop-vlm' })
    ).rejects.toThrow('Local desktop VLM failed with status 400');
  });
});
