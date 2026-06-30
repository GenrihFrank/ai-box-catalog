import type { ExtractItemsFromPhotos } from '../../domain/extraction';
import {
  extractItemsResponseSchema,
  type ExtractItemsResponse
} from '../../shared/extractionContract';

export type LocalDesktopVlmConfig = {
  endpointUrl: string;
  fetchImpl?: typeof fetch;
};

export function createLocalDesktopVlmExtractItemsFromPhotos(
  config: LocalDesktopVlmConfig
): ExtractItemsFromPhotos {
  const fetchImpl = config.fetchImpl ?? fetch;

  return async (request) => {
    const response = await fetchImpl(config.endpointUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Local desktop VLM failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return extractItemsResponseSchema.parse(payload) satisfies ExtractItemsResponse;
  };
}
