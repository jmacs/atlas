import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

type TextLogViewerProps = Omit<JSX.IntrinsicElements['section'], 'children' | 'class'> & {
  emptyMessage: string;
  headerIcon?: Child;
  controls?: Child;
  log: string;
  regionLabel?: string;
  title: string;
  class?: string;
};

export function TextLogViewer({
  emptyMessage,
  headerIcon,
  controls,
  log,
  regionLabel,
  title,
  class: className,
  ...props
}: TextLogViewerProps) {
  const label = regionLabel ?? title;

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
      <pre
        role="region"
        tabindex={0}
        aria-label={label}
        class="type-body-small h-[clamp(18rem,48dvh,36rem)] overflow-auto overscroll-contain whitespace-pre-wrap break-words [scrollbar-gutter:stable] bg-background/70 p-5 font-mono focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        {log || <span class="text-muted">{emptyMessage}</span>}
      </pre>
    </section>
  );
}
