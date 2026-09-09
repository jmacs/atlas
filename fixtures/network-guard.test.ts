import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {expect, it} from 'vitest';

const exec = promisify(execFile);
const guard = new URL('./network-guard.ts', import.meta.url).pathname;
const gateway = new URL('../lib/jellyfin/_internal/jellyfin-gateway.ts', import.meta.url).href;
const entry = new URL('../lib/actions/_internal/entry.ts', import.meta.url).href;

it('guards native SDK and fetch requests, including redirects and action workers with empty execArgv', async () => {
  const received: string[] = [];
  const sentinel = createServer((request, response) => {
    received.push(request.url!);
    if (request.url!.startsWith('/__fixtures/jellyfin/redirect/')) {
      response.writeHead(302, {location: '/unapproved'}).end();
    } else {
      expect(request.headers.authorization).toContain('Token="atlas-fixture-token"');
      response
        .writeHead(200, {'content-type': 'application/json'})
        .end('{"Items":[],"TotalRecordCount":0}');
    }
  });
  sentinel.listen(0, '127.0.0.1');
  await once(sentinel, 'listening');
  const address = sentinel.address();
  if (!address || typeof address === 'string') {
    throw new Error('Missing sentinel port');
  }
  const origin = `http://127.0.0.1:${address.port}`;
  const env = {
    ...process.env,
    NODE_OPTIONS: '',
    FIXTURES: 'true',
    PORT: String(address.port),
    JELLYFIN_SERVER: `${origin}/__fixtures/jellyfin`,
    JELLYFIN_API_KEY: 'atlas-fixture-token',
    ATLAS_FIXTURE_GUARD_LOG: '',
  };
  try {
    for (const worker of [false, true]) {
      const action = `
        import {createJellyfinGateway} from ${JSON.stringify(gateway)};
        export async function runAction() {
          const allowed = process.env.JELLYFIN_SERVER;
          const sdk = server => createJellyfinGateway({server, apiKey: process.env.JELLYFIN_API_KEY}).pullCatalog();
          await sdk(allowed);
          let blocked = 0;
          for (const operation of [() => sdk(${JSON.stringify(origin)}), () => sdk(allowed + '/redirect'),
            () => fetch(${JSON.stringify(origin + '/unapproved')}),
            () => fetch(allowed + '/redirect/Items')]) {
            try { await operation(); } catch { blocked++; }
          }
          if (blocked !== 4) throw new Error('Guard failed: ' + blocked);
          return {blocked};
        }`;
      const source = worker
        ? `
        import {Worker} from 'node:worker_threads';
        const worker = new Worker(new URL(${JSON.stringify(entry)}), {execArgv: [], workerData: {
          actionId: '00000000-0000-4000-8000-000000000001', payload: {},
          actionModule: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(action))}
        }});
        worker.on('message', message => { if (message.type !== 'succeeded' || message.result.blocked !== 4) throw new Error(JSON.stringify(message)); });
      `
        : `${action}\nawait runAction();`;
      await exec(process.execPath, ['--import', guard, '--input-type=module', '-e', source], {env});
    }
    expect(received.length).toBeGreaterThan(0);
    expect(received.every((path) => path.startsWith('/__fixtures/jellyfin/'))).toBe(true);
    for (const overrides of [
      {JELLYFIN_SERVER: ''},
      {JELLYFIN_API_KEY: ''},
      {PORT: '1'},
      {FIXTURES: 'false'},
    ]) {
      await expect(
        exec(process.execPath, ['--import', guard, '-e', ''], {env: {...env, ...overrides}}),
      ).rejects.toThrow('requires explicit matching');
    }
  } finally {
    sentinel.closeAllConnections();
    await new Promise<void>((resolve) => sentinel.close(() => resolve()));
  }
});
