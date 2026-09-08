import {CircleCheck, CircleX, Info, TriangleAlert} from '@lucide/icons';
import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

import {Icon} from './Icon.tsx';

export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

const variants = {
  success: {
    className: 'border-green-400/30 bg-green-400/10 text-green-200',
    icon: CircleCheck,
  },
  info: {
    className: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
    icon: Info,
  },
  warning: {
    className: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    icon: TriangleAlert,
  },
  error: {
    className: 'border-red-400/30 bg-red-400/10 text-red-200',
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
