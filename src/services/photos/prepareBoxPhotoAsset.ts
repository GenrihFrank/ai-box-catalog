import type { ImagePickerAsset } from 'expo-image-picker';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync
} from 'expo-file-system/legacy';

export type PreparedBoxPhotoAsset = {
  localUri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  byteSize: number;
  takenAt?: string;
};

export async function prepareBoxPhotoAsset(
  asset: ImagePickerAsset,
  boxId: string,
  photoId: string
): Promise<PreparedBoxPhotoAsset> {
  if (!documentDirectory) {
    throw new Error('Document directory is not available');
  }

  const directoryUri = `${documentDirectory}box-photos/${encodeURIComponent(boxId)}/`;
  await makeDirectoryAsync(directoryUri, { intermediates: true });

  const compressed = await manipulateAsync(
    asset.uri,
    createResizeActions(asset.width, 1600),
    { compress: 0.78, format: SaveFormat.JPEG }
  );
  const thumbnail = await manipulateAsync(
    asset.uri,
    createResizeActions(asset.width, 320),
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  const localUri = `${directoryUri}${photoId}.jpg`;
  const thumbnailUri = `${directoryUri}${photoId}-thumb.jpg`;
  await copyAsync({ from: compressed.uri, to: localUri });
  await copyAsync({ from: thumbnail.uri, to: thumbnailUri });

  const info = await getInfoAsync(localUri);

  return {
    localUri,
    thumbnailUri,
    width: compressed.width,
    height: compressed.height,
    byteSize: info.exists ? info.size : asset.fileSize ?? 0,
    takenAt: readTakenAt(asset.exif)
  };
}

function readTakenAt(exif: ImagePickerAsset['exif']): string | undefined {
  const value = exif?.DateTimeOriginal ?? exif?.DateTime ?? exif?.OffsetTimeOriginal;

  return typeof value === 'string' ? value : undefined;
}

function createResizeActions(width: number, maxWidth: number): Action[] {
  return width > maxWidth ? [{ resize: { width: maxWidth } }] : [];
}
