import { describe, expect, it } from 'vitest';

import { addBoxPhoto, type BoxPhotoRepository, type CreateBoxPhotoInput } from '../../src/domain';

class FakeBoxPhotoRepository implements BoxPhotoRepository {
  photos: CreateBoxPhotoInput[] = [];

  async create(input: CreateBoxPhotoInput) {
    this.photos.push(input);
    return input;
  }

  async listByBoxId() {
    return this.photos;
  }

  async findById() {
    return null;
  }
}

describe('addBoxPhoto', () => {
  it('creates a photo record for one box', async () => {
    const repository = new FakeBoxPhotoRepository();

    await expect(
      addBoxPhoto(
        {
          boxId: 'box-1',
          localUri: 'file:///photos/photo-1.jpg',
          thumbnailUri: 'file:///photos/photo-1-thumb.jpg',
          width: 1280,
          height: 960,
          byteSize: 120000
        },
        {
          boxPhotoRepository: repository,
          createId: () => 'photo-1',
          now: () => '2026-06-29T10:00:01.000Z'
        }
      )
    ).resolves.toMatchObject({
      id: 'photo-1',
      boxId: 'box-1',
      localUri: 'file:///photos/photo-1.jpg',
      thumbnailUri: 'file:///photos/photo-1-thumb.jpg',
      createdAt: '2026-06-29T10:00:01.000Z'
    });
  });
});
