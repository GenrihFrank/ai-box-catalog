import { buildServer } from './buildServer';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';

const server = buildServer({
  localDesktopVlmUrl: process.env.LOCAL_DESKTOP_VLM_URL
});

server
  .listen({ host, port })
  .then((address) => {
    console.info(`Extraction backend listening at ${address}`);
  })
  .catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
