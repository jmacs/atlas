import type {Child} from 'hono/jsx';

import {Card} from '../../ui/Card.tsx';
import {DesignSystemLayout} from './DesignSystemLayout.tsx';

export function TypographyPage() {
  return (
    <DesignSystemLayout
      activePath="/design-system/typography"
      title="Typography"
      description="Type styles for clear hierarchy, comfortable reading, and dense application interfaces."
    >
      <Card>
        <div class="divide-y divide-border">
          <TypeSpecimen label="Display · type-display · 36px / 40px" class="pb-8">
            <p class="type-display text-foreground">Run your server quietly.</p>
          </TypeSpecimen>
          <TypeSpecimen label="Heading 1 · type-heading-1 · 30px / 36px" class="py-8">
            <h1 class="type-heading-1">App overview</h1>
          </TypeSpecimen>
          <TypeSpecimen label="Heading 2 · type-heading-2 · 20px / 28px" class="py-8">
            <h2 class="type-heading-2">Recent activity</h2>
          </TypeSpecimen>
          <TypeSpecimen label="Heading 3 · type-heading-3 · 16px / 24px" class="py-8">
            <h3 class="type-heading-3">Workspace details</h3>
          </TypeSpecimen>
          <TypeSpecimen label="Body · type-body · 16px / 28px" class="py-8">
            <p class="type-body max-w-2xl text-muted">
              Atlas brings small, focused tools together in one place. Each app keeps its own
              navigation and identity while sharing a consistent foundation.
            </p>
          </TypeSpecimen>
          <TypeSpecimen label="Body small · type-body-small · 14px / 24px" class="py-8">
            <p class="type-body-small text-muted">
              Updated a few seconds ago · Status checks run every five minutes.
            </p>
          </TypeSpecimen>
          <TypeSpecimen label="Caption · type-caption · 12px / 16px" class="py-8">
            <p class="type-caption text-muted">Last checked at 14:32</p>
          </TypeSpecimen>
          <TypeSpecimen label="Label · type-label · 12px / 16px" class="py-8">
            <p class="type-label text-accent">System status</p>
          </TypeSpecimen>
          <TypeSpecimen label="Control · type-control · 14px / 20px" class="py-8">
            <p class="type-control">Open workspace</p>
          </TypeSpecimen>
          <TypeSpecimen label="Control small · type-control-small · 12px / 16px" class="py-8">
            <p class="type-control-small">Compact action</p>
          </TypeSpecimen>
          <TypeSpecimen label="Brand · type-brand · 14px / 20px" class="py-8">
            <p class="type-brand">Atlas</p>
          </TypeSpecimen>
          <TypeSpecimen label="Brand small · type-brand-small · 12px / 16px" class="pt-8">
            <p class="type-brand-small">Atlas</p>
          </TypeSpecimen>
        </div>
      </Card>
    </DesignSystemLayout>
  );
}

type TypeSpecimenProps = {
  children: Child;
  class: string;
  label: string;
};

function TypeSpecimen({children, class: className, label}: TypeSpecimenProps) {
  return (
    <div class={className}>
      <p class="type-caption mb-3 text-muted">{label}</p>
      {children}
    </div>
  );
}
