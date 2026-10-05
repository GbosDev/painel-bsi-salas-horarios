export const environment = {
  production: true,
  // Overridden at container start by infra/entrypoint.sh writing this value
  // into a generated env.js — see docker-compose.yml / frontend Dockerfile.
  apiBaseUrl: '/api',
};
