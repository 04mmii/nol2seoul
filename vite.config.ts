import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';
import { seoulApiResponse } from './api/_lib/seoulApi';

/**
 * Dev/preview stand-in for the Vercel function: answers /api/seoulapi with the shared proxy logic
 * (api/_lib/seoulApi.ts), so local behaviour matches production (TECH-10: 4 pages merged, ended
 * events dropped). The key stays server-side (read from .env.local, never sent to the browser).
 */
function seoulApiDev(apiKey: string | undefined): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/seoulapi')) return next();
    const type = new URL(req.url, 'http://localhost').searchParams.get('type') ?? undefined;
    seoulApiResponse(type, apiKey)
      .then((result) => {
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
        res.end(JSON.stringify(result.body));
      })
      .catch(next);
  };
  return {
    name: 'nolseoul-seoulapi-dev',
    configureServer: (server) => { server.middlewares.use(middleware); },
    configurePreviewServer: (server) => { server.middlewares.use(middleware); },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // /api/seoulapi is served by the seoulApiDev plugin below (same code as the Vercel function).
      },
      plugins: [react(), seoulApiDev(env.SEOUL_API_KEY)],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
