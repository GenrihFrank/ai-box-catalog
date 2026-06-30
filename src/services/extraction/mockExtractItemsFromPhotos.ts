import type { ExtractItemsFromPhotos } from '../../domain/extraction';

export const mockExtractItemsFromPhotos: ExtractItemsFromPhotos = async (request) => {
  return {
    suggestions: request.photoIds.map((photoId, index) => ({
      id: `mock-${photoId}`,
      name: `Mock item ${index + 1}`,
      attributes: {
        category: 'unknown'
      },
      sourcePhotoIds: [photoId],
      reason: 'Mock suggestion for UI flow development.',
      selectedByDefault: true
    }))
  };
};
