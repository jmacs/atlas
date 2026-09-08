import {Page} from '../../ui/Page.tsx';
import {ServerStatus} from '../../partials/server-status/ServerStatus.tsx';

export function Home() {
  return (
    <Page title="Task runner">
      <p>Task scheduling and run history will live here.</p>
      <button
        type="button"
        hx-get="/partials/server-status"
        hx-target="#server-status"
        hx-swap="outerHTML"
      >
        Check server status
      </button>
      <ServerStatus status="not checked" />
    </Page>
  );
}
