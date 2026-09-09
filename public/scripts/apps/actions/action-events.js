import {formatDate, formatTime} from '/scripts/i18n.js';

const root = document.querySelector('[data-action-events]');
if (root) {
  const actionStatusClasses = {
    failed: ['bg-danger/10', 'text-danger'],
    interrupted: ['bg-warning/10', 'text-warning'],
    queued: ['bg-muted/10', 'text-muted'],
    running: ['bg-info/10', 'text-info'],
    succeeded: ['bg-success/10', 'text-success'],
  };
  const logs = document.getElementById('action-logs');
  const warning = document.getElementById('action-log-warning');
  const connection = document.getElementById('action-connection');
  const follow = document.getElementById('action-follow');
  const raw = document.getElementById('action-raw');
  const lineTemplate = document.getElementById(`${logs.id}-line-template`);
  let count = 0;
  let currentAction;
  let following = true;
  function setFollowing(value) {
    following = value;
    follow.setAttribute('aria-pressed', String(value));
  }
  follow.addEventListener('click', () => {
    setFollowing(!following);
    if (following) {
      logs.scrollTop = logs.scrollHeight;
    }
  });
  logs.addEventListener('scroll', () => {
    setFollowing(logs.scrollHeight - logs.scrollTop - logs.clientHeight < 40);
  });
  raw.addEventListener('change', () => {
    logs.dataset.raw = String(raw.checked);
    for (const line of logs.querySelectorAll('[data-jsonl-line]')) {
      setRaw(line, raw.checked);
    }
    if (following) {
      logs.scrollTop = logs.scrollHeight;
    }
  });
  function setRaw(line, isRaw) {
    for (const readable of line.querySelectorAll('[data-jsonl-readable]')) {
      readable.classList.toggle('hidden', isRaw);
    }
    line.querySelector('[data-jsonl-line-raw]').classList.toggle('hidden', !isRaw);
  }
  function updateDuration() {
    if (!currentAction?.startedAt) {
      return;
    }
    const seconds = Math.max(
      0,
      Math.round(
        (Date.parse(currentAction.finishedAt ?? new Date().toISOString()) -
          Date.parse(currentAction.startedAt)) /
          1000,
      ),
    );
    document.getElementById('action-duration').textContent =
      seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  const timer = setInterval(updateDuration, 1000);
  const events = new EventSource(root.dataset.actionEvents);
  function applyStatus(action) {
    currentAction = action;
    if ('logWarning' in action) {
      warning.textContent = action.logWarning ?? '';
    }
    const status = document.getElementById('action-status');
    status.dataset.status = action.status;
    for (const classes of Object.values(actionStatusClasses)) {
      status.classList.remove(...classes);
    }
    status.classList.add(...actionStatusClasses[action.status]);
    status.querySelector('[data-status-label]').textContent = action.status;
    document.getElementById('action-started').textContent = formatDate(action.startedAt);
    document.getElementById('action-finished').textContent = formatDate(action.finishedAt);
    updateDuration();
    document.getElementById('action-result').textContent =
      action.result === null ? 'No result returned.' : JSON.stringify(action.result, null, 2);
    document.getElementById('action-error-region').hidden = !action.error;
    document.getElementById('action-error').textContent = action.error
      ? JSON.stringify(action.error, null, 2)
      : '';
  }
  events.addEventListener('reset', () => {
    logs.replaceChildren();
    count = 0;
    warning.textContent = '';
    connection.textContent = 'Live · Waiting for output';
  });
  events.addEventListener('status', (event) => applyStatus(JSON.parse(event.data)));
  events.addEventListener('log', (event) => {
    const record = JSON.parse(event.data);
    const line = lineTemplate.content.firstElementChild.cloneNode(true);
    const number = line.querySelector('[data-jsonl-line-number]');
    const timestampElement = line.querySelector('[data-jsonl-line-timestamp]');
    const level = line.querySelector('[data-jsonl-line-level]');
    const message = line.querySelector('[data-jsonl-line-message]');
    const extraElement = line.querySelector('[data-jsonl-line-extra]');
    const rawElement = line.querySelector('[data-jsonl-line-raw]');
    number.textContent = String(++count);
    timestampElement.textContent = formatTime(record?.timestamp);
    level.textContent = record?.level ?? '—';
    level.classList.toggle('text-danger', record?.level === 'error');
    level.classList.toggle('text-warning', record?.level === 'warn');
    message.textContent = record?.message ?? JSON.stringify(record);
    if (record && typeof record === 'object') {
      const extra = Object.fromEntries(
        Object.entries(record).filter(
          ([key]) => !['timestamp', 'level', 'message', 'actionId'].includes(key),
        ),
      );
      if (Object.keys(extra).length) {
        extraElement.textContent = JSON.stringify(extra);
        extraElement.classList.remove('hidden');
        message.append(extraElement);
      }
    }
    rawElement.textContent = JSON.stringify(record);
    setRaw(line, raw.checked);
    logs.append(line);
    connection.textContent = 'Live · Receiving output';
    if (following) {
      logs.scrollTop = logs.scrollHeight;
    }
  });
  events.addEventListener('complete', (event) => {
    const {action, logWarning} = JSON.parse(event.data);
    applyStatus(action);
    warning.textContent = logWarning ?? '';
    connection.textContent = 'All output received';
    if (!count) {
      logs.textContent = 'No log output for this run.';
    }
    clearInterval(timer);
    events.close();
  });
  events.onerror = () => {
    connection.textContent = 'Connection lost. Reconnecting…';
  };
  window.addEventListener(
    'pagehide',
    () => {
      events.close();
      clearInterval(timer);
    },
    {once: true},
  );
}
