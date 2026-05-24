import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev server proxy.
 *
 * The gateway (currently) doesn't send CORS headers, so the browser blocks
 * direct fetches even though the API itself is reachable. In dev we route
 * everything through `/gw/*` and let Vite proxy it server-to-server.
 *
 * In production the SPA either:
 *   (a) is served from the same origin as the gateway, or
 *   (b) the gateway sends `Access-Control-Allow-Origin`, or
 *   (c) a reverse proxy (nginx, Caddy, …) terminates both on one host.
 * In all three cases the build still calls the gateway directly — only the
 * dev server uses this proxy.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const gateway = env.VITE_GATEWAY_URL || 'http://localhost:4001';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/gw': {
          target: gateway,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/gw/, ''),
        },
      },
    },
  };
});
