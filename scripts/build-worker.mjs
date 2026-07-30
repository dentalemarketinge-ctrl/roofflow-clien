import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverDirectory = path.resolve(scriptDirectory, '../dist/server');
const workerPath = path.join(serverDirectory, 'index.js');

const workerSource = `const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      if (!env.API_ORIGIN) {
        return new Response(
          JSON.stringify({
            error: 'The SaaS API is ready but has not been connected to this deployment yet.',
          }),
          {
            status: 503,
            headers: { 'content-type': 'application/json; charset=utf-8' },
          },
        );
      }
      const upstreamUrl = new URL(url.pathname + url.search, env.API_ORIGIN);
      return fetch(new Request(upstreamUrl, request));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || request.method !== 'GET') {
      return assetResponse;
    }

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) {
      return assetResponse;
    }

    const indexUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};

export default worker;
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(workerPath, workerSource, 'utf8');
