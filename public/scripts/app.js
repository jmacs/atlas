import 'htmx.org';

const dialogOpeners = new WeakMap();
const toastDismissers = new WeakMap();

function initializeToast(toast) {
  if (!(toast instanceof HTMLElement) || toastDismissers.has(toast)) {
    return;
  }

  let remaining = Number(toast.dataset.timeout) || 5000;
  let startedAt;
  let timeout;

  const pause = () => {
    if (timeout === undefined) {
      return;
    }
    window.clearTimeout(timeout);
    timeout = undefined;
    remaining -= Date.now() - startedAt;
  };

  const dismiss = () => {
    if (toast.dataset.state === 'leaving') {
      return;
    }
    pause();

    const remove = (event) => {
      if (event.target === toast) {
        toast.removeEventListener('animationend', remove);
        toast.remove();
      }
    };

    // Register before changing state so even very short animations cannot
    // finish before the removal handler is listening.
    toast.addEventListener('animationend', remove);
    toast.dataset.state = 'leaving';

    if (getComputedStyle(toast).animationName === 'none') {
      toast.remove();
    }
  };

  const resume = () => {
    if (toast.dataset.state === 'leaving' || timeout !== undefined) {
      return;
    }
    startedAt = Date.now();
    timeout = window.setTimeout(dismiss, Math.max(remaining, 0));
  };

  toastDismissers.set(toast, dismiss);
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('mouseleave', resume);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('focusout', (event) => {
    if (!toast.contains(event.relatedTarget)) {
      resume();
    }
  });
  resume();
}

function initializeToasts(root) {
  if (root instanceof Element && root.matches('[data-toast]')) {
    initializeToast(root);
  }
  if (root instanceof Element || root instanceof Document) {
    root.querySelectorAll('[data-toast]').forEach(initializeToast);
  }
}

initializeToasts(document);

document.addEventListener('htmx:load', (event) => initializeToasts(event.detail.elt));

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const closer = target.closest('.dialog [data-dialog-close]');
  const dialog = closer?.closest('.dialog');
  if (dialog instanceof HTMLDialogElement) {
    dialog.close();
  }

  const toast = target.closest('[data-toast-close]')?.closest('[data-toast]');
  if (toast instanceof HTMLElement) {
    toastDismissers.get(toast)?.();
  }
});

document.addEventListener('htmx:afterSwap', (event) => {
  const panel = event.detail.elt;
  const dialog = panel?.parentElement;
  if (
    !(dialog instanceof HTMLDialogElement) ||
    !dialog.matches('.dialog') ||
    !panel.matches('.dialog__panel') ||
    dialog.open
  ) {
    return;
  }

  const opener = event.detail.requestConfig?.elt;
  if (opener instanceof HTMLElement) {
    dialogOpeners.set(dialog, opener);
  }
  dialog.showModal();
});

document.addEventListener(
  'close',
  (event) => {
    const opener = dialogOpeners.get(event.target);
    dialogOpeners.delete(event.target);
    if (opener?.isConnected) {
      opener.focus();
    }
  },
  true,
);
