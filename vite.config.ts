import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';
import { seoulApiResponse } from './api/_lib/seoulApi';
import { courseResponse, modelFromEnv } from './api/_lib/courseServer';

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

/**
 * Dev/preview stand-in for POST /api/course (api/_lib/courseServer.ts). ANTHROPIC_API_KEY comes from
 * .env.local on the server side only; without it the rule-based course is returned.
 * Playwright sets COURSE_AI_DISABLED=1 so tests can never reach the paid API.
 */
function courseDev(env: Record<string, string | undefined>): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/course')) return next();
    if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 200_000) req.destroy(); });
    req.on('end', () => {
      let body: unknown = null;
      try { body = JSON.parse(raw); } catch { /* 400 below */ }
      courseResponse(body, { client: req.socket.remoteAddress || 'dev', model: modelFromEnv(env) })
        .then((result) => {
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
          res.end(JSON.stringify(result.body));
        })
        .catch(next);
    });
  };
  return {
    name: 'nolseoul-course-dev',
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
      plugins: [react(), seoulApiDev(env.SEOUL_API_KEY), courseDev({ ...env, COURSE_AI_DISABLED: process.env.COURSE_AI_DISABLED ?? env.COURSE_AI_DISABLED })],
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
