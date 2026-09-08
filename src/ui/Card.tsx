import type {Child, JSX} from 'hono/jsx';
import clsx from 'clsx';

type CardProps = Omit<JSX.IntrinsicElements['section'], 'children' | 'class' | 'title'> & {
  children: Child;
  class?: string;
  description?: string;
  footer?: Child;
  title?: string;
};

export function Card({
  children,
  class: className,
  description,
  footer,
  title,
  ...props
}: CardProps) {
  return (
    <section
      class={clsx('rounded-card border border-border bg-surface shadow-sm', className)}
      {...props}
    >
      {title || description ? (
        <header class="border-b border-border px-5 py-4">
          {title ? <h2 class="type-heading-3 text-foreground">{title}</h2> : null}
          {description ? <p class="type-body-small mt-1 text-muted">{description}</p> : null}
        </header>
      ) : null}
      <div class="p-5">{children}</div>
      {footer ? <footer class="border-t border-border px-5 py-4">{footer}</footer> : null}
    </section>
  );
}
