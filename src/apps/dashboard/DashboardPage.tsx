import {buttonClassNames, Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {Page} from '../../ui/Page.tsx';
import {ServerStatus} from './ServerStatus.tsx';

export function DashboardPage() {
  return (
    <Page title="Apps">
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Jellyfin" description="Manage and explore your Jellyfin server.">
          <a class={buttonClassNames('secondary')} href="/jellyfin">
            Open Jellyfin
          </a>
        </Card>
        <Card title="Design system" description="Build, document, and test the Atlas interface.">
          <a class={buttonClassNames('primary')} href="/design-system">
            View design system
          </a>
        </Card>
        <Card title="Server" description="Check connectivity to the Atlas server.">
          <div class="flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              hx-get="/partials/server-status"
              hx-target="#server-status"
              hx-swap="outerHTML"
            >
              Check status
            </Button>
            <ServerStatus status="not checked" />
          </div>
        </Card>
      </div>
    </Page>
  );
}
