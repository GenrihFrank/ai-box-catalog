import { describe, expect, it } from 'vitest';

import { createOnDeviceVlmExtractItemsFromPhotos } from '../../src/services/extraction/onDeviceVlmExtractItemsFromPhotos';

describe('createOnDeviceVlmExtractItemsFromPhotos', () => {
  it('maps native on-device VLM items to extraction suggestions', async () => {
    const calls: unknown[] = [];
    const adapter = createOnDeviceVlmExtractItemsFromPhotos({
      nativeModule: {
        async extractItems(request) {
          calls.push(request);
          return {
            items: [
              {
                name: 'black gloves',
                attributes: {
                  color: 'black',
                  category: 'clothes'
                },
                sourcePhotoIds: ['photo-1'],
                reason: 'Visible near the top of the photo.'
              }
            ]
          };
        }
      }
    });

    await expect(
      adapter({
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
        mode: 'on-device-vlm'
      })
    ).resolves.toEqual({
      suggestions: [
        {
          id: 'on-device-vlm-1',
          name: 'black gloves',
          attributes: {
            color: 'black',
            category: 'clothes'
          },
          sourcePhotoIds: ['photo-1'],
          reason: 'Visible near the top of the photo.',
          selectedByDefault: true
        }
      ]
    });
    expect(calls).toEqual([
      {
        boxId: 'box-1',
        photos: [
          {
            id: 'photo-1',
            mimeType: 'image/jpeg',
            dataBase64: 'base64-photo-1',
            width: 1280,
            height: 960,
            byteSize: 120000
          }
        ]
      }
    ]);
  });

  it('fails clearly when native module is unavailable', async () => {
    const adapter = createOnDeviceVlmExtractItemsFromPhotos({ nativeModule: null });

    await expect(
      adapter({
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
        mode: 'on-device-vlm'
      })
    ).rejects.toThrow('On-device VLM native module is not available');
  });

  it('rejects invalid native module output', async () => {
    const adapter = createOnDeviceVlmExtractItemsFromPhotos({
      nativeModule: {
        async extractItems() {
          return { items: [{ name: '', sourcePhotoIds: [] }] } as never;
        }
      }
    });

    await expect(
      adapter({
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
        mode: 'on-device-vlm'
      })
    ).rejects.toThrow();
  });
});
