# Project guidance

- Prefer the npm scripts in `package.json` over ad hoc commands.
- Use the repository `.env`; `ATLAS_APPDATA_DIR` should be `.local/`.
- Before UI work, read `docs/jsx-conventions.md` for design-system usage, styling, and component promotion.
- Keep solutions proportional to the project: Atlas is a personal Unraid utility, not an enterprise application. Prefer
  the simplest design that solves the current problem; avoid speculative abstractions, infrastructure, extensibility, or
  robustness that is not presently needed.

## Architecture

- Atlas is a layered modular monolith: dependencies flow `src -> lib`.
- `src/apps/<name>/` is a self-contained web feature. Features expose `app.ts(x)`, are registered in
  `src/apps/index.ts`, keep routes relative to their mount path, and do not import other features.
- Keep shared presentation in `src/ui/`; keep feature-specific pages and browser workflows in their app.
- `src/main.ts` is the composition root. Keep feature rules out of `src/system/` and database repositories; schemas live
  in `lib/database/schema/`.
- Keep library implementation private by default using underscore-prefixed files or directories under
  `lib/<feature>/`, such as `lib/<feature>/_internal/`. Any library path segment beginning with `_` is private and
  must not be imported from `src/`.
- When code needs to be consumed from `src/`, expose it through a clearly named public capability module directly
  under `lib/<feature>/`.
- A public capability entrypoint is a semantic facade: it exports only the functions, classes, and types that capability
  supports, re-exporting selected private code as needed.
- Consumers in `src/` import only public capability entrypoints and never import underscore-prefixed library files or
  directories directly.
- Do not use `index.ts` or a catch-all `api.ts` as a public entrypoint. A library feature may expose multiple semantic
  capability entrypoints.
- Library features must not depend on HTTP, Hono, or JSX.

## Scripts

```shell
npm run dev    # runtime testing. Exercise the real HTTP endpoints
npm run check  # runs type checks, lint, test, and prettier check
npm run format # prettier --write .
npm run playwright:test     # run the end-to-end suite
```

## End-to-end tests

- Mirror the feature structure in `src/apps/` under `e2e/apps/`; for example, tests for `src/apps/dashboard/` live in
  `e2e/apps/dashboard/`.
- Put throwaway browser experiments in `e2e/experiments/`; it is intentionally ignored by Git.
- Use Playwright for complete user journeys and behavior that depends on a real browser, such as focus, dialogs, HTMX
  swaps, and Alpine lifecycle. Put HTTP contracts, rendered-document assertions, SSE protocol edge cases, and domain
  rules in colocated Vitest tests.
- Browser journeys must use visible UI setup and assert only records they create. Do not access storage, add cleanup or
  scenario-control routes, replace Atlas success responses, or assert global ordering, totals, or queue state.
- Use semantic locators and page objects for repeated selectors and interactions. Do not assert classes, styles, exact
  geometry, animation details, script tags, or other implementation markup.
- Do not use sleeps, `waitForTimeout`, deliberately slow work, or stretched animations. Register navigation or response
  listeners before the triggering interaction, use retrying assertions, and use the Playwright clock only for
  browser-owned timers.
- Keep the suite fully parallel. Shared external fixtures must be deterministic, and focused editor tests may intercept
  only their terminal mutation when the submitted request document is the behavior under test.
- Prefer e2e tests over starting the server and running curl commands.

Keep generated data and test artifacts inside the repository's intended directories unless a task explicitly requires
temporary storage.
