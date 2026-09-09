import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';
import {LoaderCircle} from '@lucide/icons';

import {Icon} from './Icon.tsx';

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
  /** `true` displays a persistent loading state; `htmx` displays it during an HTMX request. */
  isLoading?: boolean | 'htmx';
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  children,
  class: className,
  isLoading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  const usesHtmxLoading = isLoading === 'htmx';
  const showsLoader = isLoading === true || usesHtmxLoading;
  const isDisabled = disabled || isLoading === true;
  const htmxIndicator = usesHtmxLoading ? 'find [data-button-loader]' : undefined;
  return (
    <button
      type={type}
      class={buttonClassNames(variant, size, className)}
      disabled={isDisabled}
      aria-busy={isLoading === true ? 'true' : undefined}
      hx-indicator={htmxIndicator}
      {...props}
    >
      {showsLoader ? (
        <Icon
          class={clsx('animate-spin', usesHtmxLoading && 'htmx-indicator')}
          data-button-loader
          icon={LoaderCircle}
          size={16}
        />
      ) : null}
      {children}
    </button>
  );
}
