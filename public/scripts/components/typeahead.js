import {nextId} from '../ids.js';

export class TypeaheadElement extends HTMLElement {
  static observedAttributes = ['data-selected', 'disabled'];

  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.trigger = this.querySelector('[data-trigger]');
    this.input = this.querySelector('[data-search]');
    this.list = this.querySelector('[data-list]');
    this.status = this.querySelector('[data-status]');
    this.guidance = this.querySelector('[data-guidance]');
    this.retry = this.querySelector('[data-retry]');
    this.multiple = this.dataset.multi === 'true';
    this.initial ??= this.selectedAttributeItems();
    this.committed ??= structuredClone(this.initial);
    this.list.id = nextId('typeahead');
    this.input.setAttribute('aria-controls', this.list.id);
    this.listeners = new AbortController();
    const on = (element, event, handler) =>
      element?.addEventListener(event, handler, {signal: this.listeners.signal});
    on(this.trigger, 'click', () => this.open());
    on(this.input, 'input', () => this.search());
    on(this.input, 'keydown', (event) => this.keydown(event));
    on(this.list, 'mousedown', (event) => event.preventDefault());
    on(this.list, 'click', (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) {
        this.activate(Number(option.dataset.index));
      }
      this.input.focus();
    });
    on(this.retry, 'click', () => this.search(true));
    this.querySelectorAll('[data-cancel]').forEach((button) =>
      on(button, 'click', () => this.close()),
    );
    on(this.querySelector('[data-apply]'), 'click', () => this.apply());
    on(this.dialog, 'cancel', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    });
    on(this.dialog, 'close', () => {
      if (!this.dialog.open) {
        this.cleanupDialog();
      }
    });
    on(this.closest('form'), 'reset', (event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented || !this.isConnected) {
          return;
        }
        this.close();
        this.committed = structuredClone(this.initial);
        this.sync();
      });
    });
    this.sync();
  }

  disconnectedCallback() {
    this.close();
    this.listeners?.abort();
    this.cancelSearch();
  }

  attributeChangedCallback(name) {
    if (!this.trigger) {
      return;
    }
    if (name === 'data-selected') {
      const items = this.selectedAttributeItems();
      this.initial = structuredClone(items);
      this.committed = structuredClone(items);
      if (this.dialog.open) {
        this.draft = structuredClone(items);
        if (!this.input.value.trim()) {
          this.rows = [...this.draft];
        }
        this.render();
      }
    }
    if (this.hasAttribute('disabled')) {
      this.close();
    }
    this.sync();
  }

  selectedAttributeItems() {
    try {
      const items = JSON.parse(this.dataset.selected ?? '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  sync() {
    const disabled = this.hasAttribute('disabled');
    this.trigger.disabled = disabled;
    let summary = `Select ${this.dataset.label.toLowerCase()}`;
    if (this.committed.length) {
      summary = this.multiple ? `${this.committed.length} selected` : this.committed[0].name;
    }
    const summaryElement = this.querySelector('[data-summary]');
    if (summaryElement) {
      summaryElement.textContent = summary;
      this.trigger.setAttribute('aria-label', `${this.dataset.label}: ${summary}`);
    }
    this.querySelector('[data-inputs]').replaceChildren(
      ...this.committed.map((item) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = this.dataset.name;
        input.value = item.value;
        input.disabled = disabled;
        return input;
      }),
    );
  }

  open() {
    if (this.hasAttribute('disabled') || this.dialog.open) {
      return;
    }
    this.draft = structuredClone(this.committed);
    this.input.value = '';
    this.dialog.showModal();
    this.trigger.setAttribute('aria-expanded', 'true');
    this.input.setAttribute('aria-expanded', 'true');
    this.search();
    this.input.focus();
  }

  close() {
    if (!this.dialog?.open) {
      return;
    }
    this.dialog.close();
    this.cleanupDialog();
  }

  cleanupDialog() {
    this.cancelSearch();
    this.draft = [];
    this.trigger.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    if (this.trigger.isConnected && !this.trigger.disabled) {
      this.trigger.focus();
    }
  }

  apply() {
    const changed =
      this.committed.length !== this.draft.length ||
      this.draft.some(
        (item) =>
          !this.committed.some(
            (old) =>
              old.value === item.value &&
              old.name === item.name &&
              old.description === item.description &&
              JSON.stringify(old.data) === JSON.stringify(item.data),
          ),
      );
    this.committed = structuredClone(this.draft);
    this.sync();
    if (changed) {
      this.dispatchEvent(
        new CustomEvent('typeahead-change', {
          bubbles: true,
          detail: {items: structuredClone(this.committed)},
        }),
      );
    }
    this.close();
  }

  cancelSearch() {
    clearTimeout(this.timer);
    this.request?.abort();
    this.version = (this.version ?? 0) + 1;
  }

  search(immediate = false) {
    this.cancelSearch();
    const version = this.version;
    const query = this.input.value.trim();
    this.retry.hidden = true;
    this.active = -1;
    this.rows = query ? [] : [...this.draft];
    this.guidance.textContent =
      query || !this.draft.length ? '' : 'Selected · Activate an item to remove it';
    this.render();
    this.status.textContent = query ? 'Searching…' : 'Type to search';
    if (!query) {
      return;
    }
    this.timer = setTimeout(
      async () => {
        this.request = new AbortController();
        try {
          const url = new URL(this.dataset.source, document.baseURI);
          url.searchParams.set('q', query);
          const response = await fetch(url, {
            signal: this.request.signal,
            headers: {Accept: 'application/json'},
          });
          if (!response.ok) {
            throw new Error('Search failed');
          }
          const result = await response.json();
          if (
            typeof result.search !== 'string' ||
            typeof result.kind !== 'string' ||
            !Array.isArray(result.items) ||
            !result.items.every(
              (item) =>
                item &&
                typeof item.value === 'string' &&
                typeof item.name === 'string' &&
                (item.description === undefined || typeof item.description === 'string') &&
                (item.href === undefined || typeof item.href === 'string') &&
                (item.icon === undefined || typeof item.icon === 'string'),
            )
          ) {
            throw new Error('Invalid search response');
          }
          if (version !== this.version || !this.dialog.open) {
            return;
          }
          this.response = result;
          this.rows = [
            ...new Map(
              result.items.map(({value, name, description, href, icon, data}) => [
                value,
                {value, name, description, href, icon, data},
              ]),
            ).values(),
          ];
          this.render();
          this.status.textContent = this.rows.length ? `${this.rows.length} results` : 'No matches';
        } catch (error) {
          if (error.name === 'AbortError' || version !== this.version || !this.dialog.open) {
            return;
          }
          this.status.textContent = 'Could not load results. Try again.';
          this.retry.hidden = false;
        }
      },
      immediate ? 0 : 200,
    );
  }

  render() {
    this.list.replaceChildren(
      ...this.rows.map((item, index) => {
        const row = document.createElement('div');
        row.id = `${this.list.id}-${index}`;
        row.className = 'typeahead-option';
        row.role = 'option';
        row.setAttribute('aria-label', item.name);
        row.dataset.index = String(index);
        row.setAttribute(
          'aria-selected',
          String(this.draft.some((selected) => selected.value === item.value)),
        );
        const content = document.createElement('div');
        content.className = 'min-w-0 flex-1';
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = 'size-5 shrink-0 bg-current';
          icon.setAttribute('aria-hidden', 'true');
          icon.style.mask = `url(${JSON.stringify(item.icon)}) center / contain no-repeat`;
          row.append(icon);
        }
        const name = document.createElement('div');
        name.textContent = item.name;
        content.append(name);
        if (item.description) {
          const description = document.createElement('div');
          description.id = `${row.id}-description`;
          description.className = 'type-body-small mt-1 text-muted';
          description.textContent = item.description;
          content.append(description);
          row.setAttribute('aria-describedby', description.id);
        }
        if (item.href) {
          const href = document.createElement('div');
          href.className = 'type-caption mt-1 break-all text-muted/70';
          href.textContent = item.href;
          content.append(href);
        }
        row.append(content);
        return row;
      }),
    );
    this.navigate(this.active);
  }

  navigate(index) {
    this.active = Math.min(index, this.rows.length - 1);
    this.input.removeAttribute('aria-activedescendant');
    [...this.list.children].forEach((row, rowIndex) => {
      row.dataset.active = String(rowIndex === this.active);
      if (rowIndex === this.active) {
        this.input.setAttribute('aria-activedescendant', row.id);
        row.scrollIntoView({block: 'nearest'});
      }
    });
  }

  activate(index) {
    const item = this.rows[index];
    if (!item) {
      return;
    }
    const selected = this.draft.some((value) => value.value === item.value);
    if (!this.input.value.trim() || (this.multiple && selected)) {
      this.draft = this.draft.filter((value) => value.value !== item.value);
    } else if (this.multiple) {
      this.draft.push({...item});
    } else {
      this.draft = [{...item}];
    }
    if (!this.multiple) {
      this.apply();
      return;
    }
    this.active = index;
    if (!this.input.value.trim()) {
      this.rows = [...this.draft];
      this.guidance.textContent = this.rows.length
        ? 'Selected · Activate an item to remove it'
        : '';
    }
    this.render();
    this.status.textContent = `${this.draft.length} selected`;
  }

  keydown(event) {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.activate(this.active);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.navigate(Math.max(0, this.active + step));
    }
  }
}
