import type { ExtractItemsFromPhotos } from '../../domain/extraction';
import {
  extractItemsResponseSchema,
  type ExtractItemsResponse
} from '../../shared/extractionContract';

export type BackendExtractionConfig = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export function createBackendExtractItemsFromPhotos(config: BackendExtractionConfig): ExtractItemsFromPhotos {
  const fetchImpl = config.fetchImpl ?? fetch;
  const endpointUrl = `${config.baseUrl.replace(/\/$/, '')}/api/extract-items`;

  return async (request) => {
    const response = await fetchImpl(endpointUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Extraction backend failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return extractItemsResponseSchema.parse(payload) satisfies ExtractItemsResponse;
  };
}
