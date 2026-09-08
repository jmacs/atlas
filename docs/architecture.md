# Atlas source architecture

Atlas is a single Hono application organized as a modular monolith. Application areas are internal apps rather
than npm workspaces or independently loaded plugins. The database and action scripts remain outside `src/` because both
the web application and plain Node actions use them.

## Repository layout

```text
actions/       Plain Node scripts run by Atlas
database/      Database client, schema, and migrations shared by the server and actions
docs/          Design notes
src/
  core/        Hono hosting, authentication, app registration, and other app-wide behavior
  apps/        Vertical application areas
  ui/          Presentation shared by core and multiple apps
  main.ts      Process entry point and composition root
```

Root-level `config.ts` is also shared infrastructure and may be imported by the server, apps, database code, and
actions.

## Core

`src/core/` contains behavior required to host apps. It owns creation of the Hono host, authentication, public
assets, global error handling, logging, and the app contract. Future app-wide facilities such as the scheduler
also belong here.

Core must not import a concrete app. `createHost` receives the app list from `main.ts`, keeping knowledge of
enabled application areas at the composition root.

## Apps

Each directory under `src/apps/` is a vertical application area. An app owns its HTTP routes, pages, components,
domain rules, jobs, services, and persistence adapters. Small apps should start with only the files they need;
directories such as `domain/`, `jobs/`, or `repositories/` should be added as the app grows.

Every app exposes an `AtlasApp` from `app.ts` or `app.tsx`. Routes are relative to its `mountPath`. For example, a
Jellyfin route declared as `/catalog` is served at `/jellyfin/catalog` when the app is
mounted at `/jellyfin`.

`src/apps/index.ts` is the explicit registry of enabled apps. Atlas does not scan the filesystem or load
plugins dynamically.

Apps may import core contracts, shared UI, root database modules, and root configuration. An app must not import
another app. If multiple apps need the same behavior, move the genuinely shared portion to `core/`, `ui/`, or another
deliberate root-level shared module rather than coupling the apps.

## UI

`src/ui/` contains presentation shared across application areas, such as the document shell, page layout, navigation,
and generic form components. Feature-specific pages and components remain with their app even when they use the
shared UI primitives.

## Database and actions

`database/` is intentionally not inside `src/core/`: standalone scripts in `actions/` use the same database boundary.
As the schema grows, it may be split into feature-named files within `database/`, but migrations and database creation
remain centralized.

Actions are plain Node entry points. They may use `database/`, `config.ts`, and dependency-free domain modules where
appropriate, but they must not depend on the Hono application or HTTP route handlers.

## Dependency direction

```text
main.ts ───────▶ core
   │
   └──────────▶ apps ───────────▶ core contracts
                        ├───────▶ ui
                        ├───────▶ database/
                        └───────▶ config.ts

core ─────────▶ ui, database/, config.ts
actions/ ─────▶ database/, config.ts
```

Keep these boundaries intact:

- Core does not import concrete apps.
- Apps do not import other apps.
- Shared UI does not contain feature-specific behavior.
- Database code does not depend on the Hono server.
- Action scripts do not depend on HTTP routes.

## Adding an app

1. Create `src/apps/<name>/app.ts` (or `.tsx` when it contains JSX) and a Hono instance containing routes relative to
   the app mount.
2. Keep its pages and business logic inside the same app directory.
3. Add the exported app to `src/apps/index.ts`.
4. Add shared code outside the app only when another consumer actually needs it.

The Jellyfin app is currently a stub that verifies this composition and provides the destination for a future
migration. No Jellytool implementation has been copied into Atlas.
