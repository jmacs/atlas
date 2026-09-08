import {CircleCheck, CircleX, Info, TriangleAlert, X} from '@lucide/icons';
import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

import {Icon} from './Icon.tsx';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

const variants = {
  success: {
    className: 'border-green-400/30 bg-surface-raised text-green-200',
    icon: CircleCheck,
  },
  info: {
    className: 'border-blue-400/30 bg-surface-raised text-blue-200',
    icon: Info,
  },
  warning: {
    className: 'border-amber-400/30 bg-surface-raised text-amber-200',
    icon: TriangleAlert,
  },
  error: {
    className: 'border-red-400/30 bg-surface-raised text-red-200',
    icon: CircleX,
  },
} satisfies Record<ToastVariant, {className: string; icon: typeof CircleCheck}>;

type ToastProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  /** Insert this toast at the start of the global toast region in an HTMX response. */
  oob?: boolean;
  timeout?: number;
  variant?: ToastVariant;
};

export function Toast({
  children,
  class: className,
  oob = false,
  timeout = 5000,
  variant = 'info',
  ...props
}: ToastProps) {
  const appearance = variants[variant];

  const toast = (
    <div
      class={clsx(
        'toast type-body-small flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl',
        appearance.className,
        className,
      )}
      data-timeout={timeout}
      data-toast
      role={variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      {...props}
    >
      <Icon class="mt-0.5" icon={appearance.icon} size={18} />
      <div class="min-w-0 flex-1 text-foreground">{children}</div>
      <button
        class="-m-1 grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-border hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        type="button"
        data-toast-close
        aria-label="Dismiss notification"
      >
        <Icon icon={X} size={16} />
      </button>
    </div>
  );

  // Positional OOB swaps strip their response wrapper, so use a transport wrapper
  // to ensure HTMX inserts the complete toast element into the region.
  return oob ? <div hx-swap-oob="afterbegin:#toast-region">{toast}</div> : toast;
}

type ToastRegionProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'class' | 'id'> & {
  class?: string;
};

export function ToastRegion({class: className, ...props}: ToastRegionProps) {
  return (
    <div
      id="toast-region"
      class={clsx(
        'pointer-events-none fixed top-4 right-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-3 [&>.toast]:pointer-events-auto',
        className,
      )}
      aria-label="Notifications"
      {...props}
    />
  );
}
