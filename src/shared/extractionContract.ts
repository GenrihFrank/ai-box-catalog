import { z } from 'zod';

export const extractionModeSchema = z.enum(['mock', 'local-desktop-vlm', 'cloud-vlm']);

export const itemAttributesSchema = z
  .object({
    color: z.string().optional(),
    category: z.string().optional(),
    season: z.string().optional(),
    material: z.string().optional()
  })
  .strict();

export const extractionPhotoPayloadSchema = z
  .object({
    id: z.string().min(1),
    mimeType: z.string().min(1),
    dataBase64: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    byteSize: z.number().int().nonnegative()
  })
  .strict();

export const extractItemsRequestSchema = z
  .object({
    boxId: z.string().min(1),
    photoIds: z.array(z.string().min(1)).min(1),
    photos: z.array(extractionPhotoPayloadSchema).optional(),
    mode: extractionModeSchema
  })
  .strict();

export const extractedItemSuggestionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    attributes: itemAttributesSchema.optional(),
    sourcePhotoIds: z.array(z.string().min(1)).min(1),
    reason: z.string().optional(),
    selectedByDefault: z.boolean()
  })
  .strict();

export const extractItemsResponseSchema = z
  .object({
    suggestions: z.array(extractedItemSuggestionSchema)
  })
  .strict();

export type ExtractionMode = z.infer<typeof extractionModeSchema>;
export type ExtractionPhotoPayload = z.infer<typeof extractionPhotoPayloadSchema>;
export type ExtractItemsRequest = z.infer<typeof extractItemsRequestSchema>;
export type ExtractedItemSuggestion = z.infer<typeof extractedItemSuggestionSchema>;
export type ExtractItemsResponse = z.infer<typeof extractItemsResponseSchema>;
