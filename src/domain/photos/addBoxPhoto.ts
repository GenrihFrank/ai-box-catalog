import type { BoxPhoto } from './BoxPhoto';
import type { BoxPhotoRepository } from './BoxPhotoRepository';

export type AddBoxPhotoCommand = {
  boxId: string;
  localUri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  byteSize: number;
  takenAt?: string;
};

export type AddBoxPhotoDeps = {
  boxPhotoRepository: BoxPhotoRepository;
  createId?: () => string;
  now?: () => string;
};

export async function addBoxPhoto(command: AddBoxPhotoCommand, deps: AddBoxPhotoDeps): Promise<BoxPhoto> {
  return deps.boxPhotoRepository.create({
    id: (deps.createId ?? defaultCreateId)(),
    boxId: command.boxId,
    localUri: command.localUri,
    thumbnailUri: command.thumbnailUri,
    width: command.width,
    height: command.height,
    byteSize: command.byteSize,
    takenAt: command.takenAt,
    createdAt: (deps.now ?? defaultNow)()
  });
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
