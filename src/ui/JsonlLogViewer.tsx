import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

type JsonlLogViewerProps = Omit<JSX.IntrinsicElements['section'], 'children' | 'class'> & {
  connectionId: string;
  controls: Child;
  emptyMessage: string;
  headerIcon?: Child;
  id: string;
  initialContent?: Child;
  class?: string;
  regionLabel?: string;
  title: string;
  warningId: string;
};

export function JsonlLogViewer({
  connectionId,
  controls,
  emptyMessage,
  headerIcon,
  id,
  initialContent,
  class: className,
  title,
  regionLabel = title,
  warningId,
  ...props
}: JsonlLogViewerProps) {
  return (
    <section
      aria-label={title}
      class={clsx(
        'overflow-hidden rounded-card border border-border bg-surface shadow-lg shadow-shadow/10',
        className,
      )}
      {...props}
    >
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div class="flex items-center gap-3">
          {headerIcon}
          <h2 class="type-heading-3">{title}</h2>
        </div>
        {controls}
      </header>
      <p id={warningId} class="type-body-small px-5 py-3 text-warning empty:hidden" role="alert" />
      <div
        id={id}
        role="region"
        tabindex={0}
        aria-label={regionLabel}
        class="type-body-small h-[clamp(18rem,48dvh,36rem)] overflow-auto overscroll-contain [scrollbar-gutter:stable] bg-background/70 font-mono focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        {initialContent ?? <p class="p-5 text-muted">{emptyMessage}</p>}
      </div>
      <template id={`${id}-line-template`}>
        <div
          data-jsonl-line
          class="grid grid-cols-[4ch_9ch_5ch_minmax(0,1fr)] items-baseline gap-4 border-b border-border/20 px-5 py-1.5 hover:bg-surface max-sm:grid-cols-[4ch_8ch_minmax(0,1fr)] max-sm:gap-2 max-sm:px-3"
        >
          <span data-jsonl-line-number class="text-muted" />
          <span data-jsonl-line-timestamp data-jsonl-readable class="text-muted" />
          <span data-jsonl-line-level data-jsonl-readable class="text-muted max-sm:hidden" />
          <span data-jsonl-line-message data-jsonl-readable class="whitespace-pre-wrap break-words">
            <span data-jsonl-line-extra class="hidden block text-muted" />
          </span>
          <span
            data-jsonl-line-raw
            class="col-start-2 col-end-[-1] hidden whitespace-pre-wrap break-words"
          />
        </div>
      </template>
      <footer class="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p id={connectionId} class="type-caption text-muted" role="status">
          Connecting…
        </p>
      </footer>
    </section>
  );
}
