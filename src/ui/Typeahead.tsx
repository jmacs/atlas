import type {Child, JSX} from 'hono/jsx';
import {Search, X} from '@lucide/icons';
import clsx from 'clsx';
import {Button} from './Button.tsx';
import {Icon} from './Icon.tsx';

export type TypeaheadItem = {
  value: string;
  name: string;
  description?: string;
  href?: string;
  /** URL of a monochrome icon, rendered using the current text color. */
  icon?: string;
  /** Opaque application data returned with the item in typeahead-change events. */
  data?: unknown;
};
export type TypeaheadResponse = {search: string; kind: string; items: TypeaheadItem[]};
type TypeaheadProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'class'> & {
  name: string;
  label: string;
  source: string;
  selected?: TypeaheadItem[];
  trigger?: Child;
  multiple?: boolean;
  disabled?: boolean;
  class?: string;
};

export function Typeahead({
  name,
  label,
  source,
  selected = [],
  trigger,
  multiple = false,
  disabled = false,
  class: className,
  ...props
}: TypeaheadProps) {
  const unique = [...new Map(selected.map((item) => [item.value, item])).values()];
  const items = multiple ? unique : unique.slice(0, 1);
  let summary = `Select ${label.toLowerCase()}`;
  if (items.length) {
    summary = multiple ? `${items.length} selected` : items[0]!.name;
  }
  return (
    <atlas-typeahead
      class={clsx('block', className)}
      data-name={name}
      data-label={label}
      data-source={source}
      data-selected={JSON.stringify(items)}
      data-multi={String(multiple)}
      disabled={disabled || undefined}
      {...props}
    >
      {trigger ?? (
        <Button
          data-trigger
          class="w-full min-w-0 justify-start"
          variant="secondary"
          disabled={disabled}
          aria-label={`${label}: ${summary}`}
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          <Icon icon={Search} size={16} />
          <span data-summary class="truncate">
            {summary}
          </span>
        </Button>
      )}
      <span data-inputs>
        {items.map((item) => (
          <input type="hidden" name={name} value={item.value} disabled={disabled} />
        ))}
      </span>
      <dialog class="typeahead-dialog" aria-label={`Select ${label.toLowerCase()}`}>
        <div class="typeahead-search">
          <Icon icon={Search} class="text-muted" />
          <input
            data-search
            class="type-body min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted"
            type="text"
            role="combobox"
            aria-label={`Search ${label.toLowerCase()}`}
            aria-autocomplete="list"
            aria-expanded="false"
            autocomplete="off"
            placeholder={`Search ${label.toLowerCase()}…`}
          />
          <Button
            data-cancel
            variant="ghost"
            aria-label="Close picker"
            class="size-7 rounded-lg px-0"
          >
            <Icon icon={X} size={16} />
          </Button>
        </div>
        <div class="typeahead-results">
          <p data-guidance class="type-caption px-4 pt-3 pb-2 text-muted" />
          <div
            data-list
            role="listbox"
            aria-label={label}
            aria-multiselectable={multiple ? 'true' : undefined}
          />
          <p
            data-status
            role="status"
            aria-atomic="true"
            class="type-caption px-4 py-3 text-muted"
          />
          <Button data-retry variant="secondary" hidden>
            Retry
          </Button>
        </div>
        <footer class="typeahead-actions flex shrink-0 justify-end gap-2 px-2 pt-1 pb-2">
          <Button data-cancel variant="ghost" size="sm">
            Cancel
          </Button>
          {multiple ? (
            <Button data-apply size="sm">
              Apply
            </Button>
          ) : null}
        </footer>
      </dialog>
    </atlas-typeahead>
  );
}
