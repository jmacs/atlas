import type {Child, JSX} from 'hono/jsx';
import {ChevronDown} from '@lucide/icons';
import clsx from 'clsx';

import {Icon} from './Icon.tsx';

type AccordionProps = Omit<JSX.IntrinsicElements['details'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  title: Child;
};

/** A native disclosure for progressively revealing supporting content. */
export function Accordion({children, class: className, title, ...props}: AccordionProps) {
  return (
    <details
      class={clsx(
        'group overflow-hidden rounded-md border border-border bg-surface text-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      <summary class="type-control flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-foreground outline-none transition hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/20 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <Icon
          icon={ChevronDown}
          size={18}
          class="text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div class="border-t border-border px-5 py-4">{children}</div>
    </details>
  );
}
