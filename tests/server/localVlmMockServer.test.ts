import { describe, expect, it } from 'vitest';

import { buildLocalVlmMockServer } from '../../src/server/buildLocalVlmMockServer';

describe('POST /extract local VLM mock', () => {
  it('returns deterministic items for photo payloads', async () => {
    const server = buildLocalVlmMockServer();
    const response = await server.inject({
      method: 'POST',
      url: '/extract',
      payload: {
        boxId: 'box-1',
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          },
          {
            id: 'photo-2',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-2',
            width: 1024,
            height: 768,
            byteSize: 90000
          }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [
        {
          name: 'Local VLM mock item 1',
          attributes: {
            category: 'mock'
          },
          sourcePhotoIds: ['photo-1'],
          reason: 'Mock extraction from 1280x960 image/jpeg photo.'
        },
        {
          name: 'Local VLM mock item 2',
          attributes: {
            category: 'mock'
          },
          sourcePhotoIds: ['photo-2'],
          reason: 'Mock extraction from 1024x768 image/jpeg photo.'
        }
      ]
    });
  });

  it('rejects invalid request shape', async () => {
    const server = buildLocalVlmMockServer();
    const response = await server.inject({
      method: 'POST',
      url: '/extract',
      payload: {
        boxId: '',
        photos: []
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'Invalid local VLM request'
    });
  });
});
