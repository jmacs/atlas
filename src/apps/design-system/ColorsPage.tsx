import clsx from 'clsx';

import {Badge} from '../../ui/Badge.tsx';
import {Card} from '../../ui/Card.tsx';
import {Button} from '../../ui/Button.tsx';
import {InputField} from '../../ui/Forms.tsx';
import {DesignSystemLayout} from './DesignSystemLayout.tsx';

const colorGroups = [
  {
    title: '01 / Foundations',
    description: 'Cool ink surfaces step from the canvas to cards and elevated controls.',
    colors: [
      {
        name: 'Background',
        token: 'background',
        usage: 'The application canvas',
        className: 'bg-background',
      },
      {name: 'Surface', token: 'surface', usage: 'Cards and navigation', className: 'bg-surface'},
      {
        name: 'Raised surface',
        token: 'surface-raised',
        usage: 'Dialogs and elevated controls',
        className: 'bg-surface-raised',
      },
      {name: 'Border', token: 'border', usage: 'Dividers and card edges', className: 'bg-border'},
      {
        name: 'Control border',
        token: 'border-strong',
        usage: 'Inputs and outlined buttons',
        className: 'bg-border-strong',
      },
      {
        name: 'Supporting text',
        token: 'muted',
        usage: 'Descriptions and metadata',
        className: 'bg-muted',
      },
      {
        name: 'Foreground',
        token: 'foreground',
        usage: 'Headings and body text',
        className: 'bg-foreground',
      },
    ],
  },
  {
    title: '02 / Signals',
    description:
      'Mint marks the primary action. Rose calls attention to destructive actions and errors.',
    colors: [
      {name: 'Accent', token: 'accent', usage: 'Primary actions and focus', className: 'bg-accent'},
      {
        name: 'On accent',
        token: 'accent-foreground',
        usage: 'Text on mint backgrounds',
        className: 'bg-accent-foreground',
      },
      {
        name: 'Danger',
        token: 'danger',
        usage: 'Destructive actions and errors',
        className: 'bg-danger',
      },
      {
        name: 'On danger',
        token: 'danger-foreground',
        usage: 'Text on rose backgrounds',
        className: 'bg-danger-foreground',
      },
    ],
  },
] as const;

export function ColorsPage() {
  const groups = colorGroups.map((group) => <ColorGroupCard group={group} />);

  return (
    <DesignSystemLayout
      activePath="/design-system/colors"
      title="Color & contrast"
      description="Deep ink, clear text, and a touch of mint. A calmer workspace with distinct layers and purposeful color."
    >
      <div class="space-y-8">
        <ThemePreview />

        {groups}
      </div>
    </DesignSystemLayout>
  );
}

function ThemePreview() {
  return (
    <section
      class="overflow-hidden rounded-card border border-border bg-surface"
      aria-label="Theme preview"
    >
      <div class="grid lg:grid-cols-2">
        <div class="flex flex-col justify-center p-6 sm:p-8">
          <p class="type-label text-accent">The palette in practice</p>
          <h2 class="type-heading-2 mt-4">Clarity at every layer.</h2>
          <p class="type-body-small mt-3 max-w-md text-muted">
            Supporting text stays readable. Controls have a defined edge. Color draws attention to
            the next action.
          </p>
          <div class="mt-6 flex gap-2" aria-hidden="true">
            <span class="h-2 w-16 rounded-full bg-accent" />
            <span class="h-2 w-8 rounded-full bg-muted" />
            <span class="h-2 w-8 rounded-full bg-danger" />
          </div>
        </div>
        <div class="border-t border-border bg-background p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <div class="rounded-xl border border-border bg-surface-raised p-5 shadow-lg">
            <div class="flex items-center justify-between gap-4">
              <h3 class="type-heading-3">Your workspace</h3>
              <Badge>Preview</Badge>
            </div>
            <p class="type-body-small mt-2 text-muted">A place for everything you’re working on.</p>
            <div class="mt-5">
              <InputField
                id="palette-workspace"
                label="Workspace name"
                placeholder="e.g. Personal projects"
              />
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Delete</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ColorSwatch = {
  name: string;
  token: string;
  usage: string;
  className: string;
};

type ColorGroupCardProps = {
  group: {
    title: string;
    description: string;
    colors: readonly ColorSwatch[];
  };
};

function ColorGroupCard({group}: ColorGroupCardProps) {
  const swatches = group.colors.map((color) => <ColorSwatch color={color} />);

  return (
    <Card title={group.title} description={group.description}>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{swatches}</div>
    </Card>
  );
}

type ColorSwatchProps = {
  color: ColorSwatch;
};

function ColorSwatch({color}: ColorSwatchProps) {
  return (
    <div class="overflow-hidden rounded-xl border border-border bg-background">
      <div class={clsx('h-24 border-b border-border', color.className)} aria-hidden="true" />
      <div class="p-4">
        <h3 class="type-heading-3 text-foreground">{color.name}</h3>
        <p class="type-caption mt-1 text-muted">{color.usage}</p>
        <code class="type-caption mt-3 block break-all text-muted">--color-{color.token}</code>
      </div>
    </div>
  );
}
