const searchForms = new WeakSet();

function initializeSearchForm(form) {
  if (!(form instanceof HTMLFormElement) || searchForms.has(form)) {
    return;
  }
  const input = form.querySelector('[data-search-input]');
  const clear = form.querySelector('[data-search-clear]');
  if (!(input instanceof HTMLInputElement) || !(clear instanceof HTMLButtonElement)) {
    return;
  }

  const updateClearButton = () => {
    clear.hidden = input.value.length === 0;
  };

  clear.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.focus();
  });
  input.addEventListener('input', updateClearButton);
  updateClearButton();
  searchForms.add(form);
}

function initializeSearchForms(root) {
  if (root instanceof Element && root.matches('[data-cinefile-search]')) {
    initializeSearchForm(root);
  }
  if (root instanceof Element || root instanceof Document) {
    root.querySelectorAll('[data-cinefile-search]').forEach(initializeSearchForm);
  }
}

initializeSearchForms(document);
