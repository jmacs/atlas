import type {SSEStreamingApi} from 'hono/streaming';
import {actionRuns} from '#lib/actions/runs.ts';
import type {ActionRun} from '#lib/actions/runs.ts';

export async function streamActionEvents(stream: SSEStreamingApi, initial: ActionRun) {
  const controller = new AbortController();
  stream.onAbort(() => controller.abort());
  const send = (event: string, data: unknown) =>
    stream.writeSSE({event, data: JSON.stringify(data)});

  try {
    await send('reset', {});
    for await (const event of actionRuns.watch({id: initial.id, signal: controller.signal})) {
      if (stream.aborted) {
        return;
      }
      if (event.type === 'status') {
        await send('status', {...event.action, logWarning: event.logWarning});
      } else if (event.type === 'log') {
        await send('log', event.record);
      } else if (event.type === 'heartbeat') {
        await stream.write(': keepalive\n\n');
      } else {
        await send('complete', {action: event.action, logWarning: event.logWarning});
        return;
      }
    }
  } catch (error) {
    if (!stream.aborted) {
      await send('status', {
        ...initial,
        logWarning: `Stream failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      // Ending without complete lets EventSource reconnect after a transient status read failure.
    }
  } finally {
    controller.abort();
  }
}
