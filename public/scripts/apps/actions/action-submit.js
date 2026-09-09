const form = document.getElementById('dummy-action-form');
if (form) {
  form.addEventListener('submit', () => {
    form.querySelector('button[type="submit"]').disabled = true;
  });
  window.addEventListener('pageshow', () => {
    form.querySelector('button[type="submit"]').disabled = false;
  });
}
