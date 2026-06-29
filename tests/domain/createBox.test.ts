import { describe, expect, it } from 'vitest';

import { createBox, DuplicateBoxNumberError, type Box, type BoxRepository, type CreateBoxInput } from '../../src/domain';

class InMemoryBoxRepository implements BoxRepository {
  boxes: Box[] = [];

  async create(input: CreateBoxInput): Promise<Box> {
    const box: Box = { ...input };
    this.boxes.push(box);
    return box;
  }

  async list(): Promise<Box[]> {
    return [...this.boxes].sort((a, b) => a.number - b.number);
  }

  async findById(id: string): Promise<Box | null> {
    return this.boxes.find((box) => box.id === id) ?? null;
  }

  async findByNumber(number: number): Promise<Box | null> {
    return this.boxes.find((box) => box.number === number) ?? null;
  }
}

describe('createBox', () => {
  it('creates box with stable id and next number', async () => {
    const repository = new InMemoryBoxRepository();

    const box = await createBox(
      { label: 'Winter things' },
      {
        boxRepository: repository,
        createId: () => 'box-1',
        now: () => '2026-06-29T00:00:00.000Z'
      }
    );

    expect(box).toEqual({
      id: 'box-1',
      number: 1,
      label: 'Winter things',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });
  });

  it('uses the next number after existing boxes', async () => {
    const repository = new InMemoryBoxRepository();
    repository.boxes.push({
      id: 'box-1',
      number: 3,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    const box = await createBox(
      {},
      {
        boxRepository: repository,
        createId: () => 'box-2',
        now: () => '2026-06-29T00:00:00.000Z'
      }
    );

    expect(box.number).toBe(4);
  });

  it('rejects duplicate box number', async () => {
    const repository = new InMemoryBoxRepository();
    repository.boxes.push({
      id: 'box-1',
      number: 7,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z'
    });

    await expect(
      createBox(
        { number: 7 },
        {
          boxRepository: repository,
          createId: () => 'box-2',
          now: () => '2026-06-29T00:00:00.000Z'
        }
      )
    ).rejects.toBeInstanceOf(DuplicateBoxNumberError);
  });
});
