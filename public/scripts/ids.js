let idCounter = 0;

export function nextId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
