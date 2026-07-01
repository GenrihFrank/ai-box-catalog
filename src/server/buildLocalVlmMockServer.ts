import Fastify from 'fastify';

import {
  localDesktopVlmRequestSchema,
  localDesktopVlmResponseSchema
} from '../services/extraction/localDesktopVlmContract';

export function buildLocalVlmMockServer() {
  const server = Fastify({ logger: false });

  server.post('/extract', async (request, reply) => {
    const parsedRequest = localDesktopVlmRequestSchema.safeParse(request.body);

    if (!parsedRequest.success) {
      return reply.status(400).send({
        error: 'Invalid local VLM request',
        issues: parsedRequest.error.issues
      });
    }

    const response = localDesktopVlmResponseSchema.parse({
      items: parsedRequest.data.photos.map((photo, index) => ({
        name: `Local VLM mock item ${index + 1}`,
        attributes: {
          category: 'mock'
        },
        sourcePhotoIds: [photo.id],
        reason: `Mock extraction from ${photo.width}x${photo.height} ${photo.mimeType} photo.`
      }))
    });

    return reply.send(response);
  });

  return server;
}
