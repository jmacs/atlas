import {expect, test, vi} from 'vitest';
import {createActionRunWatcher} from './run-watcher.ts';

test('watches a run with injected storage and log dependencies', async () => {
  const action = {
    id: 'test-run',
    type: 'test',
    payload: {},
    status: 'failed' as const,
    queuedAt: '2026-09-11T00:00:00.000Z',
    startedAt: '2026-09-11T00:00:01.000Z',
    finishedAt: '2026-09-11T00:00:02.000Z',
    result: null,
    error: {message: 'Failed'},
  };
  const logs = {
    read: vi
      .fn()
      .mockResolvedValueOnce({records: [{message: 'Failed item'}], warning: null, hasData: true})
      .mockResolvedValue({records: [], warning: null, hasData: false}),
    finish: vi.fn().mockReturnValue(null),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const repository = {getAction: vi.fn().mockReturnValue(action)};
  const createLogReader = vi.fn().mockReturnValue(logs);
  const watch = createActionRunWatcher({repository, createLogReader});

  const events = await Array.fromAsync(watch({id: action.id}));

  expect(repository.getAction).toHaveBeenCalledWith(action.id);
  expect(createLogReader).toHaveBeenCalledWith(action.id);
  expect(events).toEqual([
    {type: 'status', action, logWarning: null},
    {type: 'log', record: {message: 'Failed item'}},
    {type: 'status', action, logWarning: null},
    {type: 'complete', action, logWarning: null},
  ]);
  expect(logs.close).toHaveBeenCalledOnce();
});
