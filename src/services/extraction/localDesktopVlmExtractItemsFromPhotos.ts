import type { ExtractItemsFromPhotos } from '../../domain/extraction';
import {
  type ExtractItemsResponse
} from '../../shared/extractionContract';
import {
  localDesktopVlmRequestSchema,
  localDesktopVlmResponseSchema
} from './localDesktopVlmContract';

export type LocalDesktopVlmConfig = {
  endpointUrl: string;
  fetchImpl?: typeof fetch;
};

export function createLocalDesktopVlmExtractItemsFromPhotos(
  config: LocalDesktopVlmConfig
): ExtractItemsFromPhotos {
  const fetchImpl = config.fetchImpl ?? fetch;

  return async (request) => {
    const localRequest = localDesktopVlmRequestSchema.parse({
      boxId: request.boxId,
      photos: request.photos
    });
    const response = await fetchImpl(config.endpointUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(localRequest)
    });

    if (!response.ok) {
      throw new Error(`Local desktop VLM failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const parsedPayload = localDesktopVlmResponseSchema.parse(payload);

    return {
      suggestions: parsedPayload.items.map((item, index) => ({
        id: `local-vlm-${index + 1}`,
        name: item.name,
        attributes: item.attributes,
        sourcePhotoIds: item.sourcePhotoIds,
        reason: item.reason,
        selectedByDefault: true
      }))
    } satisfies ExtractItemsResponse;
  };
}
