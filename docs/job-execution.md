# Action execution design

This document describes the first action scheduler implementation for Atlas.
The first implementation follows this design. Scheduler and action behavior are covered by Vitest; submission and log
replay are covered by Playwright.

## Scope

Users manually enqueue actions through the web UI. Submission persists the work and returns immediately; a scheduler
dispatches it on a subsequent poll when capacity is available. Each action runs in a Node worker thread.

The first feature is a button on the Jellyfin stub page that submits a dummy action with a configurable interval and turn count.
A dedicated Actions area lists actions and shows their status and logs while they run. Refreshing an action
page replays its logs from the beginning.

**Action execution is unaware of what caused an action to be submitted. Manual UI requests, future schedules,
and future workflows all converge on the same durable submission boundary.**

```text
UI/API → semantic action method → scheduler.submitAction() → SQLite queue → scheduler → registered action → operation/result/logs
```

Only the manual UI producer is implemented now. Future API callers, schedules, and workflows sit above
`submitAction()`; they produce the same durable Action without adding trigger-specific behavior to the scheduler.

This version is a small durable action scheduler. Do not add retries, cancellation, schedules, workflow dependencies,
configurable concurrency, resumability, generalized event infrastructure, or cursor-based log streaming during
implementation. Manual rerun controls and log retention policies are also deferred.

## Note for the implementation agent

Interpret this design as a small system. Defensive requirements should be handled directly, without turning them
into generalized infrastructure:

- Keep scheduler state and the active-worker guard simple.
- Keep the worker message protocol very small.
- Do not introduce generic lifecycle or event abstractions unless the implementation genuinely needs them.
- Prefer direct code over abstractions intended for hypothetical future concurrency, workflows, retries, or
  distributed execution.

## Terminology and input contract

An **Action** is one durable record, identified by an **action ID** (UUID), that moves through queued, running,
succeeded, failed, or interrupted states. Its **action type** identifies a registered operation, such as
`jellyfin.dummy`. Use action consistently in UI, schema, contracts, and function names: `submitAction`,
`claimNextAction`, and `runAction`. Future schedules or workflows are separate concepts that produce actions.

```ts
type WorkerData<TPayload extends object> = {
  actionId: string;
  payload: TPayload;
};

type DummyPayload = {
  intervalMs: number;
  turns: number;
};
```

Persist the action type separately from WorkerData. Payloads must be JSON-serializable objects and remain small:
file paths, database IDs, operation configuration, and relevant revisions. Workers load larger resources themselves.
Do not include credentials, clients, connections, executable paths, or shell commands. Resolve runtime dependencies
and credentials from controlled server configuration in the worker.

Validate the action type and payload on submission and again at the worker boundary. Enforce reasonable payload
size and duration limits. Capture inputs immutably when enqueuing; later form edits must not change queued work.

A path or database ID does not freeze the referenced contents. Each action contract must specify whether it reads
current resource contents at execution time or requires an immutable revision. Capture editable execution rules in
the payload when the operation must use exactly what the user submitted, including unsaved drafts.

## Module boundaries

- Put queue submission, polling, dispatch, scheduler lifecycle, worker supervision, and recovery in
  `lib/actions/scheduler.ts`. This module is independent of Hono and `src/system/`; initialize it alongside the host,
  not inside host construction.
- Put shared `WorkerData` and worker result/message contracts in `lib/actions/contracts.ts`, so workers do not
  need to import `src/`. The scheduler and web submission code may use these contracts.
- Keep schemas and migrations in `lib/database/`, with scheduler persistence in
  `lib/actions/scheduler.db.ts`. Use Drizzle queries and short transactions, with JSON mapping and record types derived from the schema.
- Keep each action with its owning library feature in one module, such as
  `lib/jellyfin/update-collections.action.ts`. It exports a callable `runAction` operation so unit tests can
  import it without starting a worker. `defineAction()` in `lib/actions/action.ts` owns payload capture,
  boundary validation, and the action logger lifecycle. The single worker entry point in
  `lib/actions/entry.ts` loads the registered action module and owns the completion-message protocol, so every
  action reports success and failure consistently.
  Keep the action logger factory in `lib/actions/logger.ts`, independent of the Hono application logger with no shared
  logger implementation code. Register action types and their webConfig explicitly through
  execution bootstrap; never derive an executable path from submitted data.
- Keep feature input contracts and reusable operations in `lib/<feature>/`. Feature code does not import the scheduler.
- Catalog concrete action webConfig and semantic submission methods in `lib/actions.ts`. These methods validate
  feature arguments before submission. Assemble the scheduler and submission service in `src/main.ts`; `main.ts`
  passes that service to `createHost`, which attaches it to each request's Hono context.
  Apps read it from `c.var.actions` and export ordinary `AtlasApp` instances; no app factory arguments are needed.
  `main.ts` owns migration, scheduler startup, and shutdown. Neither core nor the scheduler may import Jellyfin or
  other concrete features.
- Add `src/apps/actions/` for action lists, detail pages, and SSE routes. Register it in `src/apps/index.ts`.
  Jellyfin submits through the generic execution boundary and links to the returned action; it does not import the
  Actions app or executable webConfig.

Actions construct and release their feature-specific dependencies, invoke domain operations where applicable, and
report structured outcomes. Each worker creates its own database connection when needed; the shared action adapter
creates and closes its action logger.
The worker thread is an isolation and lifetime boundary even for actions dominated by async I/O. Supervise errors
and exits in the scheduler, and keep action-owned resources out of the Hono host. Threads reduce the impact of blocked
JavaScript and ordinary action errors but are not a security sandbox or full process isolation: process-wide native
crashes and resource exhaustion can still affect Atlas. Do not add process isolation infrastructure in this version.
Ensure aliases and worker
entry-point resolution work in both development and the production build.

### TypeScript workers

Node 24 can execute the `.ts` worker entry point and dynamically imported action webConfig directly using built-in
type stripping; no `tsx` loader is required. Use file URLs resolved by the controlled action registry. Type stripping is enabled by default
in Node 24 and is stable starting with 24.12.0. See the
[Node 24 TypeScript documentation](https://nodejs.org/download/release/v24.16.0/docs/api/typescript.html).

Use erasable TypeScript syntax, explicit type-only imports, and explicit extensions on relative imports. Native
execution does not type-check, read `tsconfig.json`, support `.tsx`, or transform features such as enums and parameter
properties under default type stripping. The repository already enables `erasableSyntaxOnly` and
`verbatimModuleSyntax`; retain type checking through the npm checks. Use Node package `imports` for aliases rather
than TypeScript-only path mappings.

Prefer running action `.ts` sources in both development and production. Production packaging must therefore include
`lib/`, including database and configuration webConfig. The build emits compiled web and TSX webConfig
under `dist/`; verify worker resolution from the built web entry point and avoid depending on inherited
development-only loader flags.

## Durable queue and dispatch

Persist at least:

- Action UUID and registered action type.
- Immutable payload.
- Status, queued timestamp, start timestamp, and finish timestamp.
- Structured result and structured error details when available.

The database is authoritative for lifecycle status and results. Logs provide execution detail; they are not the
source of truth for success or failure. Keep known partial outcomes even when the overall action fails.

`scheduler.submitAction()` checks the registered action name, captures a JSON object within the payload size limit,
and inserts a `queued` action in a short transaction. Semantic action methods validate feature arguments before
calling it; a low-level caller can enqueue invalid feature arguments, which the worker must reject. Each accepted call creates
one new UUID. An HTTP submission responds with that identity, or redirects to its detail page, without waiting for
work. Submission does not invoke a worker directly.

Submission idempotency is optional future hardening, deferred in this version. Keys would introduce form state,
lifetime, reuse, and uniqueness semantics without a current requirement to distinguish a duplicate request from an
intentional second action. Disable the submit button while its request is pending and redirect after success as basic
UI behavior; this does not guarantee deduplication. Repeated accepted requests may create separate actions.

Initial implementation defaults:

- One poller hosted by the Atlas process.
- A configurable poll interval, initially one second.
- One active action globally, with oldest queued work selected first and a stable tie-breaker.
- Dispatch only on polling ticks; completing an action frees capacity for a subsequent tick.

Under the single-instance deployment invariant below, use an
in-memory active-worker/dispatch guard set before any asynchronous claim work. Keep it held through worker exit and
terminal persistence; clear it only when that action has been finalized. Prevent overlapping polling callbacks.

`claimNextAction()` selects the oldest queued action and conditionally changes it from `queued` to `running`, with
its start timestamp, in a short transaction before worker creation. Only a successfully persisted claim may launch
a worker. Do not add an active-action uniqueness constraint or queue transactions held for the duration
of an action. The guarded dispatch loop enforces concurrency=1; the claim transaction provides
consistent durable lifecycle state. Keep queue transactions outside worker execution, file tailing, and remote I/O.
If claim or terminal persistence fails ambiguously, stop dispatching and report the error rather than clear the guard
and launch another action. Restart recovery can resolve the remaining running record.

### Single-instance deployment invariant

Atlas supports one application process and one scheduler against its app-data directory and database. Multiple
Atlas instances pointing at the same app-data directory or database are unsupported. Deployment must stop the old
process before starting its replacement; overlapping restarts are outside this model. Development and tests must
follow the same rule or use separate app-data directories.

The scheduler relies on this invariant and its in-memory active-worker guard. It does not detect or coordinate
competing Atlas processes, and it requires no scheduler ownership infrastructure. All actions must be dispatched
through this scheduler; direct worker entry-point invocation is not a supported way to bypass the queue.

## Lifecycle and recovery

| Status        | Meaning                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| `queued`      | Persisted and waiting for dispatch.                                          |
| `running`     | Claimed; worker startup or execution is in progress.                         |
| `succeeded`   | Worker reported successful completion and finished cleanly.                  |
| `failed`      | Startup failed, the action reported failure, or a supervised worker crashed. |
| `interrupted` | Execution stopped and completion cannot be established.                      |

Ordinary transitions are `queued → running → succeeded/failed`. Recovery or forced shutdown may transition
`running → interrupted`. Terminal records do not return to the queue. An unknown registered type or invalid input
discovered during dispatch must fail visibly rather than remain queued forever.

Use a small typed worker message protocol for structured results and failures. A worker exiting without its required
completion report must not count as success, even if its exit code is zero. The scheduler owns terminal database writes
and handles competing result, error, and exit notifications without finalizing twice. An action must flush and close
its logger and release resources before exiting; finalize success after its completion report and clean exit.

Store useful error information in the action record, including a message and stack where available, even when
the log file could not be created. The detail page must show this independently of the log stream.

On shutdown, stop claiming actions and allow active work a bounded grace period to finish. If the grace period expires,
terminate the worker, confirm it has stopped, and record the action as interrupted. Queued actions remain queued.

On Atlas startup, change any action still marked `running` to `interrupted` before polling starts. Under the
single-instance deployment invariant, the previous Atlas process has stopped and its worker threads cannot still
be executing. Complete this recovery update successfully before dispatching new work; if it fails, fail scheduler
startup. Queued actions remain queued and resume normal dispatch after startup. Recovery does not requeue
interrupted actions.

Worker threads die with their hosting process. After a host crash, an external mutation may nevertheless have
completed before its outcome was persisted. Record that uncertainty as interrupted; never automatically replay it.
This system does not promise exactly-once external effects.

## Per-action logging

Each worker creates a dedicated logger using the factory in `lib/actions/logger.ts`. This implementation is
separate from `src/system/logger.ts`: do not extract shared logger code or import the Hono logger. Write raw JSONL to:

```text
.local/logs/actions/{actionId}.jsonl
```

Resolve this under the configured application data directory, using the repository `.env` with
`ATLAS_APPDATA_DIR=.local/`. Derive file names from validated persisted action UUIDs, never a user-supplied file path.
Each line should include a timestamp, level, message, action ID, and any structured fields.

The existing pretty-printed application logger is separate. The worker is the sole writer to its action log;
scheduler-side startup and lifecycle failures remain visible through persisted error details and application logging.
A missing file is normal before worker startup. Logging failures during execution must be reported explicitly.

## SSE: reset and replay

Use an authenticated `GET /actions/:id/events` endpoint. Every connection reads from the beginning of the action's
JSONL file, including automatic reconnects. Do not expose a cursor, emit SSE event IDs, or implement Last-Event-ID
resume semantics in this version.

The stream protocol is:

| Event      | Browser behavior                                                         |
| ---------- | ------------------------------------------------------------------------ |
| `reset`    | Clear previously displayed logs and reset connection-local presentation. |
| `status`   | Update persisted action status and available result/error details.       |
| `log`      | Append one structured log record, rendering text safely.                 |
| `complete` | Apply final status and close the browser's EventSource.                  |

On every connection:

1. Look up the action and authorize access before opening the stream.
2. Send `reset` and the current persisted status.
3. Read complete JSONL lines from byte zero and emit each as a `log` event.
4. At EOF, wait briefly and read newly appended bytes from the same position; continue until the action is terminal.
5. Once terminal, drain the remaining complete lines, send final status and `complete`, and end the stream.

The server tracks a file offset only for the lifetime of this connection. Use one continuous read-and-follow loop
so there is no historical-replay/live-subscription gap. Preserve partial lines and UTF-8 characters between reads.
If an interrupted worker leaves a truncated final line, do not wait indefinitely or interpret it as a complete log
record; finish the stream and indicate that the log ended incompletely.

For queued work, keep the connection open while waiting for the file. For a terminal action without a file,
send its persisted outcome and complete normally. Distinguish a file that does not exist yet from an actual read
error, and show log-read errors visibly rather than silently presenting an empty successful replay.

Send periodic SSE comments to keep idle connections alive. Release readers, timers, and pending work on disconnect.
Respect streaming backpressure and avoid loading the entire file into memory. A disconnected browser does not
cancel execution. Route access uses the same authentication boundary as the rest of Atlas.

On a network drop, EventSource automatically reconnects. The new `reset` clears old rows before the server replays
the file, preventing duplicate displayed logs. A full page refresh behaves the same way. Completed actions also
replay their logs from the beginning and then close. Adding cursor-based resume is a future optimization if replay
cost becomes noticeable; the initial tradeoff is rereading and redisplaying the file after each reconnect.

## Initial UI and dummy action

Read `docs/jsx-conventions.md` before implementation of the UI.

The Jellyfin stub page has interval and turn-count inputs and a “Run dummy action” button. Submit `jellyfin.dummy` with a validated
`{intervalMs, turns}` payload and redirect to `/actions/:id`. Display validation errors on the form and disable the button while
submission is pending. Each accepted submission creates a new action.

The dummy worker logs its start, waits `intervalMs` before logging each turn, and stops after `turns` turns.
It logs completion after the last turn. Validate whole-number intervals of 1–300000 ms, 1–1000 turns, and a total
requested duration of at most 300000 ms.
It returns a small structured result. No Jellyfin connection or credentials are needed to perform this operation.

The Actions navigation destination at `/actions` shows queued and running actions prominently, followed by
completed history. Include action type, UUID/link, status, and useful timestamps; bound or paginate history. Refresh
the active list periodically so it reflects changes without a manual page reload.

The detail page at `/actions/:id` shows action identity, type, status, timestamps, result/error, and the log stream.
It works before the worker starts, during execution, and after completion. Render structured log contents as text,
not executable HTML. Refreshing the page must retain the action identity and replay all available log events.

## Acceptance checks

- Submitting from Jellyfin persists queued work and redirects immediately; dispatch occurs on a poll with capacity.
- Each accepted submission creates a new action; the UI disables submission while its request is pending.
- Two queued actions execute serially, including when poll callbacks overlap or worker startup fails.
- Claim or terminal persistence failure stops dispatch without launching additional actions.
- The dummy worker receives the captured UUID/payload and produces its own JSONL log and persisted result.
- The Actions list reflects queued, running, and terminal work.
- The detail page streams progress, replays from the beginning on refresh, and clears/replays on reconnect without
  duplicate rows.
- A completed action replays its entire log and closes its stream; a queued action waits for log creation.
- Worker startup errors, thrown errors, and unexpected exits produce visible terminal failures without retries.
- Atlas startup marks remaining running actions interrupted before dispatch and preserves queued actions for normal
  polling. Failed recovery prevents dispatch.
- Missing logs, truncated final lines, and logging failures do not conceal persisted status or leave terminal streams
  waiting indefinitely.
- Browser disconnects release stream resources while the action continues.
- Worker startup and imports work under both development and production builds.

Prefer end-to-end coverage for the submission and live-view workflows, with focused lifecycle/persistence tests for
claiming, startup recovery, and worker failure cases. Mirror feature structure under `e2e/`. Run the repository checks and
relevant tests as part of implementation.
