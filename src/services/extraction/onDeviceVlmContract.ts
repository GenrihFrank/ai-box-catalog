import { z } from 'zod';

import {
  extractionPhotoPayloadSchema,
  itemAttributesSchema
} from '../../shared/extractionContract';

export const onDeviceVlmRequestSchema = z
  .object({
    boxId: z.string().min(1),
    photos: z.array(extractionPhotoPayloadSchema).min(1)
  })
  .strict();

export const onDeviceVlmItemSchema = z
  .object({
    name: z.string().min(1),
    attributes: itemAttributesSchema.optional(),
    sourcePhotoIds: z.array(z.string().min(1)).min(1),
    reason: z.string().optional()
  })
  .strict();

export const onDeviceVlmResponseSchema = z
  .object({
    items: z.array(onDeviceVlmItemSchema)
  })
  .strict();

export type OnDeviceVlmRequest = z.infer<typeof onDeviceVlmRequestSchema>;
export type OnDeviceVlmItem = z.infer<typeof onDeviceVlmItemSchema>;
export type OnDeviceVlmResponse = z.infer<typeof onDeviceVlmResponseSchema>;
