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

  it('reports non-mock modes as not implemented', async () => {
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
      error: 'Extraction mode local-desktop-vlm is not implemented'
    });
  });
});
