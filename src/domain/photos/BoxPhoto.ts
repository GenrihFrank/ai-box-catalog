export type BoxPhoto = {
  id: string;
  boxId: string;
  localUri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  byteSize: number;
  takenAt?: string;
  createdAt: string;
};
