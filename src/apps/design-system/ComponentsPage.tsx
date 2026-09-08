import type {Child} from 'hono/jsx';

import {Accordion} from '../../ui/Accordion.tsx';
import {Alert} from '../../ui/Alert.tsx';
import {Badge} from '../../ui/Badge.tsx';
import {Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {InputField, SelectField, TextAreaField, Toggle} from '../../ui/Forms.tsx';
import {Table, TableBuilder} from '../../ui/Table.tsx';
import {ToastRegion, type ToastVariant} from '../../ui/Toast.tsx';
import {DesignSystemLayout} from './DesignSystemLayout.tsx';

export function ComponentsPage() {
  return (
    <DesignSystemLayout
      activePath="/design-system"
      title="Component gallery"
      description="A working inventory of the shared UI building blocks used across Atlas apps."
    >
      <ToastRegion />
      <div class="grid gap-6 lg:grid-cols-2">
        <AlertExamples />

        <ToastExamples />

        <ButtonExamples />

        <BadgeExamples />

        <CardExample />

        <AccordionExample />

        <FormControlExamples />

        <TableExample />
      </div>
    </DesignSystemLayout>
  );
}

const toastExamples: Array<{label: string; variant: ToastVariant}> = [
  {label: 'Success toast', variant: 'success'},
  {label: 'Info toast', variant: 'info'},
  {label: 'Warning toast', variant: 'warning'},
  {label: 'Error toast', variant: 'error'},
];

function ToastExamples() {
  return (
    <Card
      class="lg:col-span-2"
      title="Toasts"
      description="Temporary feedback returned by the server and inserted out of band by HTMX. New toasts push earlier messages down."
    >
      <div class="flex flex-wrap gap-3">
        {toastExamples.map(({label, variant}) => (
          <Button
            hx-get={`/design-system/toasts/example?variant=${variant}`}
            hx-swap="none"
            aria-controls="toast-region"
            variant="secondary"
          >
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function AlertExamples() {
  return (
    <Card
      class="lg:col-span-2"
      title="Alerts"
      description="Banner messages provide contextual feedback after an action or status change."
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <Alert variant="success">Your settings were saved successfully.</Alert>
        <Alert variant="info">
          A new Atlas version is available.{' '}
          <a class="font-medium underline underline-offset-2" href="#">
            View release notes
          </a>
          .
        </Alert>
        <Alert variant="warning">Storage is nearing its configured capacity.</Alert>
        <Alert variant="error">Atlas could not connect to the server.</Alert>
      </div>
    </Card>
  );
}

function BadgeExamples() {
  return (
    <Card
      title="Badges"
      description="Compact labels for status, categories, and supporting context."
    >
      <div class="flex flex-wrap items-center gap-3">
        <Badge>Preview</Badge>
        <Badge variant="neutral">Draft</Badge>
        <Badge variant="danger">Attention needed</Badge>
      </div>
    </Card>
  );
}

function ButtonExamples() {
  return (
    <Card title="Buttons" description="Actions use a quiet hierarchy with a single accent color.">
      <div class="flex flex-wrap items-center gap-3">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Delete</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button size="sm">Small button</Button>
        <Button size="md">Default button</Button>
      </div>
    </Card>
  );
}

function CardExample() {
  return (
    <Card
      title="Card"
      description="A flexible surface for grouping related information."
      footer={<p class="type-caption text-muted">Optional card footer</p>}
    >
      <p class="type-body-small text-muted">
        Cards separate meaningful groups without making every section feel heavy or boxed in.
      </p>
    </Card>
  );
}

function AccordionExample() {
  return (
    <Card
      title="Accordion"
      description="A compact disclosure for secondary information and optional settings."
    >
      <div class="space-y-3">
        <Accordion title="Connection details" open>
          <p class="type-body-small text-muted">
            This server uses a secure connection and checks its status every five minutes.
          </p>
        </Accordion>
      </div>
    </Card>
  );
}

function FormControlExamples() {
  return (
    <Card
      class="lg:col-span-2"
      title="Form controls"
      description="Inputs share consistent labels, help text, focus states, and validation states."
    >
      <form class="grid gap-6 sm:grid-cols-2" action="#" method="get">
        <InputField
          id="server-name"
          name="server-name"
          label="Server name"
          placeholder="media-server"
          validationMessage="A recognizable name for this connection."
        />
        <SelectField
          id="server-region"
          name="server-region"
          label="Region"
          validationMessage="Used when presenting regional status."
        >
          <option value="ca-east">Canada East</option>
          <option value="us-east">US East</option>
          <option value="eu-west">Europe West</option>
        </SelectField>
        <InputField
          id="server-url"
          name="server-url"
          type="url"
          label="Server URL"
          value="not-a-url"
          error
          validationMessage="Enter a valid URL."
        />
        <SelectField id="disabled-select" label="Unavailable control" disabled>
          <option>Disabled</option>
        </SelectField>
        <TextAreaField
          id="server-notes"
          name="server-notes"
          label="Notes"
          placeholder="Add details about this server"
          validationMessage="Optional context for other administrators."
          fieldClass="sm:col-span-2"
        />
        <Toggle
          id="server-notifications"
          name="server-notifications"
          value="enabled"
          label="Status notifications"
          description="Send an alert when this server becomes unavailable."
          checked
        />
        <Toggle
          id="maintenance-mode"
          name="maintenance-mode"
          value="enabled"
          label="Maintenance mode"
          description="Pause automated work while the server is being updated."
        />
      </form>
    </Card>
  );
}

type Server = {
  name: string;
  region: string;
  status: Child;
  storage: number;
};

const servers: Server[] = [
  {
    name: 'Atlas',
    status: <Badge>Online</Badge>,
    region: 'Canada East',
    storage: 18.4,
  },
  {
    name: 'Archive',
    status: <Badge variant="neutral">Maintenance</Badge>,
    region: 'US East',
    storage: 42.1,
  },
  {
    name: 'Backup',
    status: <Badge variant="danger">Offline</Badge>,
    region: 'Europe West',
    storage: 8.7,
  },
];

function TableExample() {
  return (
    <Card
      class="lg:col-span-2"
      title="Table"
      description="Structured data with semantic headers and flexible cell content."
    >
      <ServerTable sort="server" />
    </Card>
  );
}

export function ServerTable({sort}: {sort: string}) {
  const sortedServers = sortServers(servers, sort);
  const table = new TableBuilder<Server>({
    id: 'server-table',
    hxGet: '/design-system/table',
    sort,
  })
    .column({
      id: 'server',
      header: 'Server',
      cell: (server) => server.name,
      cellClass: 'font-medium text-foreground',
      sortable: true,
    })
    .column({id: 'status', header: 'Status', cell: (server) => server.status})
    .column({
      id: 'region',
      header: 'Region',
      cell: (server) => server.region,
      cellClass: 'text-muted',
      sortable: true,
    })
    .column({
      id: 'storage',
      header: 'Storage',
      cell: (server) => `${server.storage.toFixed(1)} TB`,
      align: 'right',
      cellClass: 'text-right tabular-nums',
      headerClass: 'text-right',
      sortable: true,
    });

  return <Table caption="Configured media servers" data={sortedServers} {...table.build()} />;
}

function sortServers(data: Server[], sort: string) {
  const sortColumn = sort.startsWith('-') ? sort.slice(1) : sort;
  const descending = sort.startsWith('-');
  return [...data].sort((left, right) => {
    let result: number;
    if (sortColumn === 'storage') {
      result = left.storage - right.storage;
    } else if (sortColumn === 'region') {
      result = left.region.localeCompare(right.region);
    } else {
      result = left.name.localeCompare(right.name);
    }
    return descending ? -result : result;
  });
}
