import { buildLocalVlmMockServer } from './buildLocalVlmMockServer';

const port = Number(process.env.LOCAL_VLM_MOCK_PORT ?? 8788);
const host = process.env.HOST ?? '0.0.0.0';

const server = buildLocalVlmMockServer();

server
  .listen({ host, port })
  .then((address) => {
    console.info(`Local VLM mock listening at ${address}`);
  })
  .catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
