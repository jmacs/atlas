export class QuickNavElement extends HTMLElement {
  connectedCallback() {
    this.listeners = new AbortController();
    const options = {signal: this.listeners.signal};
    const trigger = this.querySelector('[data-trigger]');
    this.querySelector('[data-shortcut]').textContent = /Mac|iPhone|iPad/.test(navigator.platform)
      ? '⌘ K'
      : 'Ctrl K';
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 'k' &&
          !event.altKey &&
          !event.isComposing
        ) {
          event.preventDefault();
          if (!event.repeat) {
            trigger.click();
          }
        }
      },
      options,
    );
    this.addEventListener(
      'typeahead-change',
      (event) => {
        const item = event.detail.items[0];
        if (!item?.href) {
          return;
        }
        let destination;
        try {
          destination = new URL(item.href, window.location.href);
        } catch {
          return;
        }
        if (
          destination.origin === window.location.origin &&
          destination.protocol === window.location.protocol
        ) {
          window.location.assign(destination.href);
        }
      },
      options,
    );
  }

  disconnectedCallback() {
    this.listeners?.abort();
  }
}
