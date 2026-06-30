import Fastify from 'fastify';
import { ZodError } from 'zod';

import {
  extractItemsRequestSchema,
  extractItemsResponseSchema
} from '../shared/extractionContract';
import { mockExtractItemsFromPhotos } from '../services/extraction/mockExtractItemsFromPhotos';

export function buildServer() {
  const server = Fastify({ logger: false });

  server.post('/api/extract-items', async (request, reply) => {
    const parsedRequest = extractItemsRequestSchema.safeParse(request.body);

    if (!parsedRequest.success) {
      return reply.status(400).send({
        error: 'Invalid extract items request',
        issues: parsedRequest.error.issues
      });
    }

    if (parsedRequest.data.mode !== 'mock') {
      return reply.status(501).send({
        error: `Extraction mode ${parsedRequest.data.mode} is not implemented`
      });
    }

    try {
      const response = await mockExtractItemsFromPhotos(parsedRequest.data);
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
