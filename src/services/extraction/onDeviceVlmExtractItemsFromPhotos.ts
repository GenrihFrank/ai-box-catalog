import type { ExtractItemsFromPhotos } from '../../domain/extraction';
import type { ExtractItemsResponse } from '../../shared/extractionContract';
import {
  onDeviceVlmRequestSchema,
  onDeviceVlmResponseSchema,
  type OnDeviceVlmRequest,
  type OnDeviceVlmResponse
} from './onDeviceVlmContract';

export type OnDeviceVlmNativeModule = {
  extractItems(request: OnDeviceVlmRequest): Promise<OnDeviceVlmResponse>;
};

export type OnDeviceVlmConfig = {
  nativeModule?: OnDeviceVlmNativeModule | null;
};

export function createOnDeviceVlmExtractItemsFromPhotos(config: OnDeviceVlmConfig): ExtractItemsFromPhotos {
  return async (request) => {
    if (!config.nativeModule) {
      throw new Error('On-device VLM native module is not available');
    }

    const nativeRequest = onDeviceVlmRequestSchema.parse({
      boxId: request.boxId,
      photos: request.photos
    });
    const payload = await config.nativeModule.extractItems(nativeRequest);
    const parsedPayload = onDeviceVlmResponseSchema.parse(payload);

    return {
      suggestions: parsedPayload.items.map((item, index) => ({
        id: `on-device-vlm-${index + 1}`,
        name: item.name,
        attributes: item.attributes,
        sourcePhotoIds: item.sourcePhotoIds,
        reason: item.reason,
        selectedByDefault: true
      }))
    } satisfies ExtractItemsResponse;
  };
}
