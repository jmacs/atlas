import {formatDate} from '#lib/utils/dates.ts';
import {ArrowLeft, Terminal} from '@lucide/icons';
import type {ActionRun} from '#lib/actions/runs.ts';
import {Button, buttonClassNames} from '../../ui/Button.tsx';
import {DescriptionList, DescriptionListItem} from '../../ui/DescriptionList.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {JsonlLogViewer} from '../../ui/JsonlLogViewer.tsx';
import {ActionsLayout} from './ActionsLayout.tsx';
import {duration} from './ActionRun.tsx';
import {ActionStatus} from './ActionStatus.tsx';

type ActionDetailPageProps = {action: ActionRun};

const scripts = ['/scripts/apps/actions/action-events.js'];

export function ActionDetailPage({action}: ActionDetailPageProps) {
  return (
    <ActionsLayout title={action.type} scripts={scripts}>
      <a href="/actions" class={buttonClassNames('ghost', 'sm', '-ml-3 mb-6')}>
        <Icon icon={ArrowLeft} size={16} />
        All actions
      </a>
      <div class="space-y-6" data-action-events={`/actions/${action.id}/events`}>
        <header>
          <p class="type-label mb-3 text-muted">Action run</p>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="type-heading-1 break-all sm:type-display">{action.type}</h1>
            <ActionStatus id="action-status" role="status" status={action.status} />
          </div>
          <p class="type-body-small mt-3 text-muted">
            Run {action.id.slice(0, 8)}
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            <time dateTime={action.queuedAt}>{formatDate(action.queuedAt)}</time>
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            <a
              href={`/actions/${action.id}/log`}
              download={`action-${action.id}.jsonl`}
              class="underline decoration-muted underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Download log
            </a>
          </p>
        </header>
        <DescriptionList class="grid-cols-2 gap-5 border-y border-border/70 py-5 sm:grid-cols-4">
          <DescriptionListItem label="Duration">
            <span id="action-duration" class="tabular-nums">
              {duration(action)}
            </span>
          </DescriptionListItem>
          <DescriptionListItem label="Queued">{formatDate(action.queuedAt)}</DescriptionListItem>
          <DescriptionListItem label="Started">
            <span id="action-started">{formatDate(action.startedAt)}</span>
          </DescriptionListItem>
          <DescriptionListItem label="Finished">
            <span id="action-finished">{formatDate(action.finishedAt)}</span>
          </DescriptionListItem>
        </DescriptionList>
        <JsonlLogViewer
          id="action-logs"
          title="Logs"
          regionLabel="Action logs"
          emptyMessage="Waiting for log output…"
          warningId="action-log-warning"
          connectionId="action-connection"
          headerIcon={<Icon icon={Terminal} size={18} class="text-muted" />}
          controls={
            <div class="flex items-center gap-3">
              <label class="type-control-small flex cursor-pointer items-center gap-2 text-muted">
                <input id="action-raw" type="checkbox" class="accent-accent" />
                Raw JSON
              </label>
              <Button
                id="action-follow"
                variant="ghost"
                size="sm"
                aria-pressed="true"
                class="aria-pressed:bg-accent/10 aria-pressed:text-accent"
              >
                Follow logs
              </Button>
            </div>
          }
        />
        <details class="rounded-card border border-border/70 bg-surface/30">
          <summary class="type-control cursor-pointer rounded-card px-5 py-4 focus-visible:outline-2 focus-visible:outline-accent">
            Run details <span class="type-caption ml-2 text-muted">Input &amp; result</span>
          </summary>
          <div class="space-y-5 border-t border-border/70 p-5">
            <div>
              <h2 class="type-caption text-muted">Run ID</h2>
              <p class="type-body-small mt-2 break-all">{action.id}</p>
            </div>
            <div>
              <h2 class="type-heading-3">Input</h2>
              <pre class="type-body-small mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(action.payload, null, 2)}
              </pre>
            </div>
            <div>
              <h2 class="type-heading-3">Result</h2>
              <pre
                id="action-result"
                class="type-body-small mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words"
              >
                {action.result === null ? 'No result yet.' : JSON.stringify(action.result, null, 2)}
              </pre>
            </div>
          </div>
        </details>
        <section
          id="action-error-region"
          hidden={!action.error}
          class="rounded-card border border-danger/30 bg-danger/10 p-5"
          aria-label="Run error"
        >
          <h2 class="type-heading-3 text-danger">Run error</h2>
          <pre
            id="action-error"
            class="type-body-small mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-danger"
          >
            {action.error ? JSON.stringify(action.error, null, 2) : ''}
          </pre>
        </section>
      </div>
    </ActionsLayout>
  );
}
