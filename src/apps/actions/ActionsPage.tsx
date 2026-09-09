import {formatDate} from '#lib/utils/dates.ts';
import {ChevronRight} from '@lucide/icons';
import type {ActionRun, ActionRunList} from '#lib/actions/runs.ts';
import {PageHeader} from '../../ui/Page.tsx';
import {Button, buttonClassNames} from '../../ui/Button.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {ActionsLayout} from './ActionsLayout.tsx';
import {duration} from './ActionRun.tsx';
import {ActionStatus} from './ActionStatus.tsx';

export function ActionsPage({actions}: ActionListProps) {
  return (
    <ActionsLayout title="Actions">
      <PageHeader title="Actions" description="A history of running and completed actions." />
      <ActionList actions={actions} />
    </ActionsLayout>
  );
}

type RunGroupProps = {
  title: string;
  description: string;
  actions: ActionRun[];
  empty: string;
};

function RunGroup({title, description, actions, empty}: RunGroupProps) {
  const rows = actions.map((action) => (
    <li>
      <a
        href={`/actions/${action.id}`}
        class="group flex items-center gap-4 px-5 py-5 transition hover:bg-surface-raised/50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 sm:px-6"
      >
        <div class="min-w-0 flex-1">
          <p class="type-heading-3 truncate group-hover:text-accent">{action.type}</p>
          <p class="type-caption mt-1.5 text-muted">
            <time dateTime={action.queuedAt} title={formatDate(action.queuedAt)}>
              {formatDate(action.queuedAt)}
            </time>
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            <span class="inline-block" title={action.id}>
              Run {action.id.slice(0, 8)}
            </span>
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:gap-6">
          <span class="type-body-small tabular-nums text-muted">{duration(action)}</span>
          <ActionStatus status={action.status} />
        </div>
        <Icon icon={ChevronRight} size={16} class="hidden text-muted sm:block" />
      </a>
    </li>
  ));
  return (
    <section aria-label={title}>
      <header class="mb-4 flex items-baseline justify-between gap-4">
        <h2 class="type-heading-2">
          {title}
          <span class="type-caption ml-3 text-muted">{actions.length}</span>
        </h2>
        <p class="type-caption text-right text-muted">{description}</p>
      </header>
      <div class="overflow-hidden rounded-card border border-border/70 bg-surface/50">
        {actions.length ? (
          <ul class="divide-y divide-border/60">{rows}</ul>
        ) : (
          <p class="type-body-small px-6 py-8 text-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}

type ActionListProps = {
  actions: ActionRunList;
};

export function ActionList({actions}: ActionListProps) {
  const runs = [...actions.active, ...actions.history];
  return (
    <div
      id="action-list"
      class="space-y-10"
      hx-get={`/actions/list?page=${actions.page}`}
      hx-trigger="every 10s"
      hx-swap="outerHTML"
    >
      <RunGroup
        title="Runs"
        description={`Page ${actions.page} of ${actions.pageCount}`}
        actions={runs}
        empty="No runs yet. Actions will appear here when they start."
      />
      <nav aria-label="Runs pagination" class="flex justify-end gap-2">
        {actions.page > 1 ? (
          <a class={buttonClassNames('ghost', 'sm')} href={`/actions?page=${actions.page - 1}`}>
            Previous
          </a>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Previous
          </Button>
        )}
        {actions.page < actions.pageCount ? (
          <a class={buttonClassNames('ghost', 'sm')} href={`/actions?page=${actions.page + 1}`}>
            Next
          </a>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Next
          </Button>
        )}
      </nav>
    </div>
  );
}
