// Native Node preload, installed before application configuration or SDK imports.
// Worker wrapping deliberately covers schedulers that specify execArgv: [].
import http from 'node:http';
import https from 'node:https';
import workers from 'node:worker_threads';
import {syncBuiltinESMExports} from 'node:module';
import {appendFileSync} from 'node:fs';

const expected = `http://127.0.0.1:${process.env.PORT}/__fixtures/jellyfin`;
if (
  process.env.FIXTURES !== 'true' ||
  process.env.JELLYFIN_SERVER !== expected ||
  process.env.JELLYFIN_API_KEY !== 'atlas-fixture-token' ||
  !/^[1-9]\d*$/.test(process.env.PORT ?? '') ||
  Number(process.env.PORT) > 65535
) {
  throw new Error(
    'Fixture network guard requires explicit matching loopback URL, port and synthetic token',
  );
}
const allowed = new URL(expected);
function check(url: URL) {
  if (
    url.origin !== allowed.origin ||
    !url.pathname.startsWith(`${allowed.pathname}/`) ||
    url.username ||
    url.password
  ) {
    // Do not log URLs/headers: an accidental inherited credential must stay private.
    const message = 'Fixture network guard blocked an unapproved HTTP destination';
    if (process.env.ATLAS_FIXTURE_GUARD_LOG) {
      appendFileSync(process.env.ATLAS_FIXTURE_GUARD_LOG, `${message}\n`);
    }
    throw new Error(message);
  }
}

for (const transport of [http, https]) {
  const original = transport.request;
  transport.request = function (...args: Parameters<typeof http.request>) {
    const first = args[0];
    const supplied = typeof args[1] === 'object' ? args[1] : {};
    const initial = typeof first === 'string' || first instanceof URL ? new URL(first) : undefined;
    const options = {
      ...(initial
        ? {
            protocol: initial.protocol,
            hostname: initial.hostname,
            port: initial.port,
            path: initial.pathname + initial.search,
          }
        : (first as http.RequestOptions)),
      ...supplied,
    };
    if (options.socketPath || options.createConnection || options.lookup) {
      throw new Error('Fixture network guard rejects custom connections');
    }
    check(
      new URL(
        `${options.protocol ?? (transport === https ? 'https:' : 'http:')}//${options.hostname ?? options.host ?? 'localhost'}${options.port ? `:${options.port}` : ''}${options.path ?? '/'}`,
      ),
    );
    return Reflect.apply(original, transport, args);
  } as typeof http.request;
  transport.get = function (...args: Parameters<typeof http.get>) {
    const request = Reflect.apply(transport.request, transport, args);
    request.end();
    return request;
  } as typeof http.get;
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  check(new URL(input instanceof Request ? input.url : input));
  // Fetch's internal redirects bypass http.request; stop them at the first response.
  const response = await originalFetch(input, {...init, redirect: 'manual'});
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (location) {
      check(new URL(location, response.url));
    }
    throw new Error('Fixture network guard rejects fetch redirects');
  }
  return response;
};
const OriginalWorker = workers.Worker;
workers.Worker = class extends OriginalWorker {
  constructor(filename: string | URL, options: workers.WorkerOptions = {}) {
    super(filename, {
      ...options,
      execArgv: [...(options.execArgv ?? []), '--import', import.meta.url],
    });
  }
};
syncBuiltinESMExports();
