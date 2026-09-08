import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-foreground hover:brightness-110',
  secondary: 'border border-border-strong bg-surface-raised text-foreground hover:bg-border',
  ghost: 'text-muted hover:bg-surface-raised hover:text-foreground',
  danger: 'bg-danger text-danger-foreground hover:brightness-110',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'type-control-small h-8 px-3',
  md: 'type-control h-10 px-4',
};

export function buttonClassNames(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = Omit<JSX.IntrinsicElements['button'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  children,
  class: className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button type={type} class={buttonClassNames(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
