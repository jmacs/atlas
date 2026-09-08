import type {LucideIconData, LucideIconNode} from '@lucide/icons';
import {jsx} from 'hono/jsx';
import type {Child} from 'hono/jsx';
import clsx from 'clsx';

type IconProps = {
  [attribute: string]: unknown;
  class?: string;
  icon: LucideIconData;
  size?: number | string;
  /** Accessible name. Omit for decorative icons. */
  title?: string;
};

function renderNode([tag, attributes, children]: LucideIconNode): Child {
  const props = Object.fromEntries(Object.entries(attributes).filter(([name]) => name !== 'key'));

  return jsx(tag, props, ...(children?.map(renderNode) ?? []));
}

export function Icon({class: className, icon, size = 24, title, ...props}: IconProps) {
  const nodes = icon.node.map(renderNode);

  return (
    <svg
      aria-hidden={title ? undefined : true}
      class={clsx('inline-block shrink-0', className)}
      fill="none"
      height={size}
      role={title ? 'img' : undefined}
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {nodes}
    </svg>
  );
}
