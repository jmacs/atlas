import type {ActionRunStatus} from '#lib/actions/runs.ts';
import clsx from 'clsx';
import type {JSX} from 'hono/jsx';

const statusClasses: Record<ActionRunStatus, string> = {
  failed: 'bg-danger/10 text-danger',
  interrupted: 'bg-warning/10 text-warning',
  queued: 'bg-muted/10 text-muted',
  running: 'bg-info/10 text-info',
  succeeded: 'bg-success/10 text-success',
};

type ActionStatusProps = Omit<JSX.IntrinsicElements['span'], 'children' | 'class'> & {
  class?: string;
  status: ActionRunStatus;
};

export function ActionStatus({class: className, status, ...props}: ActionStatusProps) {
  return (
    <span
      data-status={status}
      class={clsx(
        'type-control-small inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        statusClasses[status],
        className,
      )}
      {...props}
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
      <span data-status-label>{status}</span>
    </span>
  );
}
