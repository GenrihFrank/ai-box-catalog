import { z } from 'zod';

import {
  extractionPhotoPayloadSchema,
  itemAttributesSchema
} from '../../shared/extractionContract';

export const localDesktopVlmRequestSchema = z
  .object({
    boxId: z.string().min(1),
    photos: z.array(extractionPhotoPayloadSchema).min(1)
  })
  .strict();

export const localDesktopVlmItemSchema = z
  .object({
    name: z.string().min(1),
    attributes: itemAttributesSchema.optional(),
    sourcePhotoIds: z.array(z.string().min(1)).min(1),
    reason: z.string().optional()
  })
  .strict();

export const localDesktopVlmResponseSchema = z
  .object({
    items: z.array(localDesktopVlmItemSchema)
  })
  .strict();

export type LocalDesktopVlmRequest = z.infer<typeof localDesktopVlmRequestSchema>;
export type LocalDesktopVlmItem = z.infer<typeof localDesktopVlmItemSchema>;
export type LocalDesktopVlmResponse = z.infer<typeof localDesktopVlmResponseSchema>;
