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
      return new Response(
        JSON.stringify({
          error: 'The hosted preview does not include the private CRM API.',
        }),
        {
          status: 503,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      );
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
