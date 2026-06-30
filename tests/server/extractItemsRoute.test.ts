import { describe, expect, it } from 'vitest';

import { buildServer } from '../../src/server/buildServer';

describe('POST /api/extract-items', () => {
  it('returns mock suggestions for a valid request', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1', 'photo-2'],
        mode: 'mock'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      suggestions: [
        {
          id: 'mock-photo-1',
          name: 'Mock item 1',
          sourcePhotoIds: ['photo-1'],
          selectedByDefault: true
        },
        {
          id: 'mock-photo-2',
          name: 'Mock item 2',
          sourcePhotoIds: ['photo-2'],
          selectedByDefault: true
        }
      ]
    });
  });

  it('rejects invalid request shape', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: '',
        photoIds: [],
        mode: 'mock'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'Invalid extract items request'
    });
  });

  it('requires local desktop VLM url for local mode', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        mode: 'local-desktop-vlm'
      }
    });

    expect(response.statusCode).toBe(501);
    expect(response.json()).toMatchObject({
      error: 'LOCAL_DESKTOP_VLM_URL is required for local-desktop-vlm mode'
    });
  });

  it('uses configured local desktop VLM adapter', async () => {
    const requests: unknown[] = [];
    const server = buildServer({
      localDesktopVlmUrl: 'http://127.0.0.1:8788/extract',
      localDesktopVlmExtractItemsFromPhotos: async (request) => {
        requests.push(request);
        return {
          suggestions: [
            {
              id: 'suggestion-1',
              name: 'black gloves',
              sourcePhotoIds: ['photo-1'],
              selectedByDefault: true
            }
          ]
        };
      }
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          }
        ],
        mode: 'local-desktop-vlm'
      }
    });

    expect(requests).toEqual([
      {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          }
        ],
        mode: 'local-desktop-vlm'
      }
    ]);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      suggestions: [
        {
          id: 'suggestion-1',
          name: 'black gloves',
          sourcePhotoIds: ['photo-1'],
          selectedByDefault: true
        }
      ]
    });
  });

  it('validates local desktop VLM adapter response', async () => {
    const server = buildServer({
      localDesktopVlmUrl: 'http://127.0.0.1:8788/extract',
      localDesktopVlmExtractItemsFromPhotos: async () =>
        ({
          suggestions: [
            {
              id: '',
              name: '',
              sourcePhotoIds: [],
              selectedByDefault: true
            }
          ]
        }) as never
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          }
        ],
        mode: 'local-desktop-vlm'
      }
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      error: 'Invalid extraction adapter response'
    });
  });

  it('reports local desktop VLM adapter errors', async () => {
    const server = buildServer({
      localDesktopVlmUrl: 'http://127.0.0.1:8788/extract',
      localDesktopVlmExtractItemsFromPhotos: async () => {
        throw new Error('local model unavailable');
      }
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          }
        ],
        mode: 'local-desktop-vlm'
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      error: 'local model unavailable'
    });
  });

  it('requires photos for configured local desktop VLM mode', async () => {
    const server = buildServer({
      localDesktopVlmUrl: 'http://127.0.0.1:8788/extract'
    });
    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        mode: 'local-desktop-vlm'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'local-desktop-vlm mode requires photos'
    });
  });

  it('reports cloud mode as not implemented', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/extract-items',
      payload: {
        boxId: 'box-1',
        photoIds: ['photo-1'],
        mode: 'cloud-vlm'
      }
    });

    expect(response.statusCode).toBe(501);
    expect(response.json()).toMatchObject({
      error: 'Extraction mode cloud-vlm is not implemented'
    });
  });
});
