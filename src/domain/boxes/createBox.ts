import type { Box } from './Box';
import type { BoxRepository } from './BoxRepository';

export type CreateBoxCommand = {
  number?: number;
  label?: string;
};

export type CreateBoxDeps = {
  boxRepository: BoxRepository;
  createId?: () => string;
  now?: () => string;
};

export class DuplicateBoxNumberError extends Error {
  constructor(number: number) {
    super(`Box number ${number} already exists`);
    this.name = 'DuplicateBoxNumberError';
  }
}

export async function createBox(command: CreateBoxCommand, deps: CreateBoxDeps): Promise<Box> {
  const number = command.number ?? (await getNextBoxNumber(deps.boxRepository));
  const existingBox = await deps.boxRepository.findByNumber(number);

  if (existingBox) {
    throw new DuplicateBoxNumberError(number);
  }

  const timestamp = (deps.now ?? defaultNow)();

  return deps.boxRepository.create({
    id: (deps.createId ?? defaultCreateId)(),
    number,
    label: command.label,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

async function getNextBoxNumber(repository: BoxRepository): Promise<number> {
  const boxes = await repository.list();
  const maxNumber = boxes.reduce((max, box) => Math.max(max, box.number), 0);
  return maxNumber + 1;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `box-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
