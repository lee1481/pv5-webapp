import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import worker from './dist/_worker.js';

const app = new Hono();

// 정적 파일 서빙 (Node.js 방식)
app.use('/static/*', serveStatic({ root: './public' }));

// 나머지 요청은 worker로
app.all('*', async (c) => {
  try {
    return await worker.fetch(c.req.raw, {}, {});
  } catch (error) {
    console.error('Worker error:', error);
    return c.text('Internal Server Error', 500);
  }
});

const port = 3000;

console.log('Starting server on port', port);

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`);
});



