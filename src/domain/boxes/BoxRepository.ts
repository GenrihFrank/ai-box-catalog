import type { Box } from './Box';

export type CreateBoxInput = {
  id: string;
  number: number;
  label?: string;
  createdAt: string;
  updatedAt: string;
};

export type BoxRepository = {
  create(input: CreateBoxInput): Promise<Box>;
  list(): Promise<Box[]>;
  findById(id: string): Promise<Box | null>;
  findByNumber(number: number): Promise<Box | null>;
};
