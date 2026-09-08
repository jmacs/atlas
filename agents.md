# Project guidance

- Prefer the npm scripts in `package.json` over ad hoc commands.
- Use the repository `.env`; `ATLAS_APPDATA_DIR` should be `.local/`.

## Architecture

- Atlas is a modular-monolith Hono app: `src/main.ts` is the composition root; `createHost` in `src/core/host.tsx` creates the root Hono host and `src/core/` must not import concrete apps.
- Each `src/apps/<name>/` directory is a self-contained vertical feature. Export its `AtlasApp` from `app.ts(x)`, register it explicitly in `src/apps/index.ts`, and keep routes relative to its `mountPath`.
- Apps may use core contracts, `src/ui/`, `database/`, and `config.ts`, but must never import another app. Keep feature UI in its app; put only genuinely cross-app presentation in `src/ui/`.
- `database/` and root `config.ts` are shared by the web app and `actions/`. Actions are plain Node scripts and must not depend on Hono or HTTP route handlers.

## Scripts

```shell
npm run dev    # runtime testing. Exercise the real HTTP endpoints
npm run check  # runs type checks, lint, and prettier check
npm run playwright:test     # run the end-to-end suite
npm run playwright:test:file -- e2e/design-system/dialogs.spec.ts  # run one test file
```

## End-to-end tests

- Mirror the feature structure in `src/` under `e2e/`; for example, tests for `src/apps/dashboard/` live in `e2e/dashboard/`.
- Put throwaway browser experiments in `e2e/experiments/`; it is intentionally ignored by Git.
- Prefer e2e tests over starting the server and running curl commands

Keep generated data and test artifacts inside the repository's intended directories unless a task explicitly requires
temporary storage.
