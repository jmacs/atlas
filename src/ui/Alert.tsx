import {CircleCheck, CircleX, Info, TriangleAlert} from '@lucide/icons';
import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

import {Icon} from './Icon.tsx';

export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

const variants = {
  success: {
    className: 'border-success/30 bg-success/10 text-success',
    icon: CircleCheck,
  },
  info: {
    className: 'border-info/30 bg-info/10 text-info',
    icon: Info,
  },
  warning: {
    className: 'border-warning/30 bg-warning/10 text-warning',
    icon: TriangleAlert,
  },
  error: {
    className: 'border-danger/30 bg-danger/10 text-danger',
    icon: CircleX,
  },
} satisfies Record<AlertVariant, {className: string; icon: typeof CircleCheck}>;

type AlertProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  variant?: AlertVariant;
};

export function Alert({children, class: className, variant = 'info', ...props}: AlertProps) {
  const appearance = variants[variant];

  return (
    <div
      class={clsx(
        'type-body-small flex items-start gap-3 rounded-xl border px-4 py-3',
        appearance.className,
        className,
      )}
      role="alert"
      {...props}
    >
      <Icon class="mt-0.5" icon={appearance.icon} size={18} />
      <div class="min-w-0 flex-1">{children}</div>
    </div>
  );
}
