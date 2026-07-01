import { requireNativeModule } from 'expo-modules-core';

export type OnDeviceVlmPhotoPayload = {
  id: string;
  mimeType: string;
  dataBase64: string;
  width: number;
  height: number;
  byteSize: number;
};

export type OnDeviceVlmNativeRequest = {
  boxId: string;
  photos: OnDeviceVlmPhotoPayload[];
};

export type OnDeviceVlmNativeItem = {
  name: string;
  attributes?: {
    color?: string;
    category?: string;
    season?: string;
    material?: string;
  };
  sourcePhotoIds: string[];
  reason?: string;
};

export type OnDeviceVlmNativeResponse = {
  items: OnDeviceVlmNativeItem[];
};

export type AiBoxCatalogOnDeviceVlmModule = {
  extractItems(request: OnDeviceVlmNativeRequest): Promise<OnDeviceVlmNativeResponse>;
};

export default requireNativeModule<AiBoxCatalogOnDeviceVlmModule>('AiBoxCatalogOnDeviceVlm');
