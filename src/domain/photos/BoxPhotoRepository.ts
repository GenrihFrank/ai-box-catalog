import type { BoxPhoto } from './BoxPhoto';

export type CreateBoxPhotoInput = BoxPhoto;

export type BoxPhotoRepository = {
  create(input: CreateBoxPhotoInput): Promise<BoxPhoto>;
  listByBoxId(boxId: string): Promise<BoxPhoto[]>;
  findById(id: string): Promise<BoxPhoto | null>;
};
