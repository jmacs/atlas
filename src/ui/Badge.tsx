import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

export type BadgeVariant = 'accent' | 'neutral' | 'danger';

const variants: Record<BadgeVariant, string> = {
  accent: 'bg-accent/10 text-accent',
  neutral: 'bg-surface-raised text-muted',
  danger: 'bg-danger text-danger-foreground',
};

type BadgeProps = Omit<JSX.IntrinsicElements['span'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  variant?: BadgeVariant;
};

export function Badge({children, class: className, variant = 'accent', ...props}: BadgeProps) {
  return (
    <span
      class={clsx(
        'type-control-small inline-flex rounded-full px-2.5 py-1',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
