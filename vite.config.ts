import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/seoulapi': {
            target: 'http://openapi.seoul.go.kr:8088',
            changeOrigin: true,
            rewrite: (path) => {
              const url = new URL(path, 'http://localhost');
              const type = url.searchParams.get('type') || 'event';
              const endpoints: Record<string, string> = {
                event: 'culturalEventInfo',
                night: 'viewNightSpot',
                space: 'culturalSpaceInfo',
              };
              const endpoint = endpoints[type] || 'culturalEventInfo';
              return `/${env.SEOUL_API_KEY}/json/${endpoint}/1/1000/`;
            },
          },
        },
      },
      plugins: [react()],
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
