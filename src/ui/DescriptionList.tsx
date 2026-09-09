import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

type DescriptionListProps = Omit<JSX.IntrinsicElements['dl'], 'children' | 'class'> & {
  children: Child;
  class?: string;
};

export function DescriptionList({children, class: className, ...props}: DescriptionListProps) {
  return (
    <dl class={clsx('grid gap-4', className)} {...props}>
      {children}
    </dl>
  );
}

type DescriptionListItemProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'class'> & {
  children: Child;
  class?: string;
  label: Child;
};

export function DescriptionListItem({
  children,
  class: className,
  label,
  ...props
}: DescriptionListItemProps) {
  return (
    <div class={className} {...props}>
      <dt class="type-caption text-muted">{label}</dt>
      <dd class="type-body-small mt-1">{children}</dd>
    </div>
  );
}
