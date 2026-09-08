import type {Child, JSX} from 'hono/jsx';
import {X} from '@lucide/icons';
import clsx from 'clsx';

import {Button} from './Button.tsx';
import {Icon} from './Icon.tsx';

type DialogSectionProps<T extends keyof JSX.IntrinsicElements> = Omit<
  JSX.IntrinsicElements[T],
  'children' | 'class'
> & {
  children?: Child;
  class?: string;
};

// Set modal dimensions with utilities such as max-w-xl or h-96.
// Swapping HTMX content into the panel opens the modal via public/scripts/app.js.
export function Dialog({children, class: className, ...props}: DialogSectionProps<'dialog'>) {
  return (
    <dialog class={clsx('dialog', className)} {...props}>
      <DialogPanel>{children}</DialogPanel>
    </dialog>
  );
}

// The same surface can be rendered in normal document flow without dialog behavior.
export function DialogPanel({children, class: className, ...props}: DialogSectionProps<'div'>) {
  return (
    <div
      class={clsx(
        'dialog__panel flex min-h-0 min-w-0 flex-col overflow-hidden bg-surface-raised text-foreground shadow-2xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DialogHeaderProps = Omit<DialogSectionProps<'header'>, 'title' | 'children'> & {
  title: string;
  message?: string;
  /** ID for the heading, referenced by the dialog's aria-labelledby. */
  titleId?: string;
};

export function DialogHeader({
  class: className,
  title,
  message,
  titleId,
  ...props
}: DialogHeaderProps) {
  return (
    <header
      class={clsx(
        'flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4',
        className,
      )}
      {...props}
    >
      <div>
        <h2 id={titleId} class="type-heading-3 text-foreground">
          {title}
        </h2>
        {message ? <p class="type-body-small mt-1 text-muted">{message}</p> : null}
      </div>
      <Button
        data-dialog-close
        class="size-8 shrink-0 px-0 text-lg leading-none"
        variant="ghost"
        aria-label="Close dialog"
      >
        <Icon icon={X} size={24} />
      </Button>
    </header>
  );
}

export function DialogContent({children, class: className, ...props}: DialogSectionProps<'div'>) {
  return (
    <div class={clsx('min-h-0 flex-1 overflow-y-auto p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({children, class: className, ...props}: DialogSectionProps<'footer'>) {
  return (
    <footer
      class={clsx(
        'flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
