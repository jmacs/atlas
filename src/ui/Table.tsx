import {ChevronDown, ChevronUp} from '@lucide/icons';
import clsx from 'clsx';
import type {Child, JSX} from 'hono/jsx';

import {Icon} from './Icon.tsx';

export type SortDirection = 'asc' | 'desc';

export type SortableHeaderProps = {
  align?: 'left' | 'right';
  buttonId?: string;
  buttonLabel?: string;
  children: Child;
  class?: string;
  direction?: SortDirection;
  hxGet: string;
  hxSwap?: string;
  hxTarget: string;
};

export function SortableHeader({
  align = 'left',
  buttonId,
  buttonLabel,
  children,
  class: className,
  direction,
  hxGet,
  hxSwap = 'outerHTML',
  hxTarget,
}: SortableHeaderProps) {
  let ariaSort: 'ascending' | 'descending' | 'none' = 'none';
  if (direction) {
    ariaSort = direction === 'asc' ? 'ascending' : 'descending';
  }
  const directionIcon = direction === 'asc' ? ChevronUp : ChevronDown;

  return (
    <th scope="col" aria-sort={ariaSort} class={className}>
      <button
        id={buttonId}
        type="button"
        class={clsx(
          'flex w-full items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/30',
          align === 'right' ? 'justify-end' : 'justify-start',
        )}
        hx-get={hxGet}
        hx-target={hxTarget}
        hx-swap={hxSwap}
        aria-label={buttonLabel}
      >
        <span>{children}</span>
        {direction ? <Icon icon={directionIcon} size={16} /> : null}
      </button>
    </th>
  );
}

export type TableColumn<Row> = {
  cell: (row: Row) => Child;
  cellClass?: string;
  header: Child;
  headerClass?: string;
  id: string;
  sort?: Omit<SortableHeaderProps, 'children' | 'class'>;
};

export type TableBuilderColumn<Row> = Omit<TableColumn<Row>, 'sort'> & {
  align?: 'left' | 'right';
  sortable?: boolean;
  sortLabel?: string;
};

export type TableBuilderOptions = {
  hxGet: string;
  hxSwap?: string;
  id: string;
  sort: string;
};

export class TableBuilder<Row> {
  private readonly columnDefinitions: TableColumn<Row>[];
  private readonly options: TableBuilderOptions;

  constructor(options: TableBuilderOptions) {
    this.columnDefinitions = [];
    this.options = options;
  }

  column(column: TableBuilderColumn<Row>): this {
    const {align, sortable, sortLabel, ...columnDefinition} = column;
    if (!sortable) {
      this.columnDefinitions.push(columnDefinition);
      return this;
    }

    const descending = this.options.sort === `-${column.id}`;
    const active = this.options.sort === column.id || descending;
    const nextSort = active && !descending ? `-${column.id}` : column.id;
    const separator = this.options.hxGet.includes('?') ? '&' : '?';
    const label = sortLabel ?? (typeof column.header === 'string' ? column.header : column.id);
    let direction: SortDirection | undefined;
    if (active) {
      direction = descending ? 'desc' : 'asc';
    }

    this.columnDefinitions.push({
      ...columnDefinition,
      sort: {
        align,
        buttonId: `${this.options.id}-sort-${column.id}`,
        buttonLabel: `Sort by ${label}, ${nextSort.startsWith('-') ? 'descending' : 'ascending'}`,
        direction,
        hxGet: `${this.options.hxGet}${separator}sort=${encodeURIComponent(nextSort)}`,
        hxSwap: this.options.hxSwap,
        hxTarget: `#${this.options.id}`,
      },
    });
    return this;
  }

  build() {
    return {id: this.options.id, columns: [...this.columnDefinitions]};
  }
}

export type TableProps<Row> = Omit<JSX.IntrinsicElements['div'], 'children' | 'class'> & {
  caption: Child;
  captionClass?: string;
  class?: string;
  columns: readonly TableColumn<Row>[];
  data: readonly Row[];
};

export function Table<Row>({
  caption,
  captionClass = 'sr-only',
  class: className,
  columns,
  data,
  ...props
}: TableProps<Row>) {
  return (
    <div class={clsx('table-scroll rounded-lg border border-border', className)} {...props}>
      <table class="table">
        <caption class={captionClass}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) =>
              column.sort ? (
                <SortableHeader key={column.id} class={column.headerClass} {...column.sort}>
                  {column.header}
                </SortableHeader>
              ) : (
                <th key={column.id} scope="col" class={column.headerClass}>
                  {column.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr>
              {columns.map((column) => (
                <td key={column.id} class={column.cellClass}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
