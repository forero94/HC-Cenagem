export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  payloadLimit: process.env.API_PAYLOAD_LIMIT ?? '12mb',
});
