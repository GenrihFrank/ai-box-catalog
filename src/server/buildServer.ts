import Fastify from 'fastify';
import { ZodError } from 'zod';

import {
  extractItemsRequestSchema,
  extractItemsResponseSchema
} from '../shared/extractionContract';
import { createLocalDesktopVlmExtractItemsFromPhotos } from '../services/extraction/localDesktopVlmExtractItemsFromPhotos';
import { mockExtractItemsFromPhotos } from '../services/extraction/mockExtractItemsFromPhotos';
import type { ExtractItemsFromPhotos } from '../domain/extraction';

export type ServerConfig = {
  localDesktopVlmUrl?: string;
  localDesktopVlmExtractItemsFromPhotos?: ExtractItemsFromPhotos;
};

export function buildServer(config: ServerConfig = {}) {
  const server = Fastify({ logger: false });

  server.post('/api/extract-items', async (request, reply) => {
    const parsedRequest = extractItemsRequestSchema.safeParse(request.body);

    if (!parsedRequest.success) {
      return reply.status(400).send({
        error: 'Invalid extract items request',
        issues: parsedRequest.error.issues
      });
    }

    if (parsedRequest.data.mode === 'cloud-vlm') {
      return reply.status(501).send({
        error: `Extraction mode ${parsedRequest.data.mode} is not implemented`
      });
    }

    if (parsedRequest.data.mode === 'on-device-vlm') {
      return reply.status(400).send({
        error: 'on-device-vlm mode runs on the mobile app, not the extraction backend'
      });
    }

    if (parsedRequest.data.mode === 'local-desktop-vlm' && !config.localDesktopVlmUrl) {
      return reply.status(501).send({
        error: 'LOCAL_DESKTOP_VLM_URL is required for local-desktop-vlm mode'
      });
    }

    if (parsedRequest.data.mode === 'local-desktop-vlm' && !parsedRequest.data.photos?.length) {
      return reply.status(400).send({
        error: 'local-desktop-vlm mode requires photos'
      });
    }

    try {
      const extractItemsFromPhotos =
        parsedRequest.data.mode === 'local-desktop-vlm'
          ? config.localDesktopVlmExtractItemsFromPhotos ??
            createLocalDesktopVlmExtractItemsFromPhotos({
              endpointUrl: config.localDesktopVlmUrl as string
            })
          : mockExtractItemsFromPhotos;
      const response = await extractItemsFromPhotos(parsedRequest.data);
      const parsedResponse = extractItemsResponseSchema.parse(response);
      return reply.send(parsedResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(502).send({
          error: 'Invalid extraction adapter response',
          issues: error.issues
        });
      }

      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Extraction failed'
      });
    }
  });

  return server;
}
