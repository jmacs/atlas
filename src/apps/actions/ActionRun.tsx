import type {ActionRun} from '#lib/actions/runs.ts';

export function duration(action: ActionRun) {
  if (!action.startedAt) {
    return 'Waiting';
  }
  const seconds = Math.max(
    0,
    Math.round(
      (Date.parse(action.finishedAt ?? new Date().toISOString()) - Date.parse(action.startedAt)) /
        1000,
    ),
  );
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
