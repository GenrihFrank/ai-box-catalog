import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

import type { BoxPhoto } from '../../domain/photos';
import type { ExtractionPhotoPayload } from '../../shared/extractionContract';

export type ReadPhotoAsBase64 = (uri: string) => Promise<string>;

export async function createExtractionPhotoPayloads(
  photos: BoxPhoto[],
  readPhotoAsBase64: ReadPhotoAsBase64 = defaultReadPhotoAsBase64
): Promise<ExtractionPhotoPayload[]> {
  return Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      mimeType: 'image/jpeg',
      dataBase64: await readPhotoAsBase64(photo.localUri),
      width: photo.width,
      height: photo.height,
      byteSize: photo.byteSize
    }))
  );
}

async function defaultReadPhotoAsBase64(uri: string): Promise<string> {
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}
