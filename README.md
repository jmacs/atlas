# Alfred

A small Hono app using Node.js 24, TypeScript ESM, and HTMX.

## Local development

Install Node.js 24, then run:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The page includes an HTMX-powered server-status
partial. HTMX is installed with npm and served locally at `/assets/htmx.js`.
`public/scripts/app.js` imports that ES module and is served as the
`/scripts/app.js` browser entry point.
All files below `public/scripts/` are available below `/scripts/` without
individual route registration. No CDN or bundler is needed. Server dependencies
use Node's normal npm module resolution.

```sh
npm run typecheck
npm run build
npm start
```

Development uses the `tsx` file watcher. Production uses `npm run build` to emit
JavaScript into `dist/`, then runs it with Node without a runtime transformer.
Hono JSX does not require React. Type checking is also available separately.

## Project structure

```text
database/             shared SQLite and repository code
public/               browser-served JavaScript and other static assets
server/               Hono application and HTTP concerns
  api/<route>/        JSON endpoint registration
  pages/<route>/      full-page route registration and owned UI
  partials/<route>/   HTML-fragment registration and owned UI
  ui/                 shared server-rendered UI
  route.ts            application route aggregator
worker/               scheduler and background process execution
```

Each route folder exports `register(app)` from `route.ts` or `route.tsx`. The
root `server/route.ts` imports those functions and registers them with the app.
Page and partial UI stays beside its route; UI used across routes belongs in
`server/ui/`.

Dependencies point inward toward shared state: `server/` and `worker/` may
import from `database/`, while `database/` must not import either runtime.
Browser code is kept in `public/` and is served as static content.

`server/paths.ts` finds the application root from its own module and the
repository `package.json`. It therefore points to the same top-level
`database/` and `worker/` directories from both `server/` during development
and `dist/server/` in production. Worker spawning must use these resolved
directories rather than paths based on the current working directory.

Local development reads `ATLAS_APPDATA_DIR` from `.env`; it defaults to
`.local/`. Database code resolves `atlas.sqlite` beneath that directory. In a
container, set `ATLAS_APPDATA_DIR` to the mounted application-data directory.

## Docker / Unraid

Build and run with Docker:

```sh
docker build -t alfred .
docker run -d --name alfred --restart unless-stopped -p 3000:3000 alfred
```

The app listens on **0.0.0.0:3000**, and the container exposes TCP port **3000**.
On Unraid, use bridge networking and map container port 3000 to an available
host port. Open `http://<unraid-ip>:3000` (or your chosen host port).
To use host port 8080, pass `-p 8080:3000` instead.

Build the image on the Unraid server, or push it to a registry accessible to
Unraid. If building elsewhere, target your server's CPU architecture.
The container runs as the unprivileged `node` user. Mount the persistent Unraid
application-data directory at `/appdata`; the image sets `ATLAS_APPDATA_DIR` to
that location.
