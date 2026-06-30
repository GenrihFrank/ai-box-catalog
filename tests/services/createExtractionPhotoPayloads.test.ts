import { describe, expect, it, vi } from 'vitest';

import type { BoxPhoto } from '../../src/domain';

vi.mock('expo-file-system/legacy', () => ({
  EncodingType: {
    Base64: 'base64'
  },
  readAsStringAsync: vi.fn()
}));

import { createExtractionPhotoPayloads } from '../../src/services/extraction/createExtractionPhotoPayloads';

describe('createExtractionPhotoPayloads', () => {
  it('reads local photos as base64 payloads for extraction backend', async () => {
    const readUris: string[] = [];
    const payloads = await createExtractionPhotoPayloads(
      [
        createPhoto({
          id: 'photo-1',
          localUri: 'file:///photos/photo-1.jpg',
          width: 1280,
          height: 960,
          byteSize: 120000
        }),
        createPhoto({
          id: 'photo-2',
          localUri: 'file:///photos/photo-2.jpg',
          width: 1024,
          height: 768,
          byteSize: 90000
        })
      ],
      async (uri) => {
        readUris.push(uri);
        return uri.endsWith('photo-1.jpg') ? 'base64-photo-1' : 'base64-photo-2';
      }
    );

    expect(readUris).toEqual(['file:///photos/photo-1.jpg', 'file:///photos/photo-2.jpg']);
    expect(payloads).toEqual([
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
    ]);
  });
});

function createPhoto(overrides: Pick<BoxPhoto, 'id' | 'localUri' | 'width' | 'height' | 'byteSize'>): BoxPhoto {
  return {
    boxId: 'box-1',
    thumbnailUri: `${overrides.localUri}-thumb.jpg`,
    takenAt: undefined,
    createdAt: '2026-06-30T09:00:00.000Z',
    ...overrides
  };
}
