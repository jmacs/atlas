import {Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogPanel} from '../../ui/Dialog.tsx';
import {DesignSystemLayout} from './DesignSystemLayout.tsx';
import {dialogExamples} from './dialogExamples.ts';

export function DialogsPage() {
  return (
    <DesignSystemLayout
      activePath="/design-system/dialogs"
      title="Dialogs"
      description="A focused surface for decisions or short, self-contained tasks."
    >
      <div class="grid gap-6 lg:grid-cols-2">
        <DialogAnatomyExample />

        <LiveModalExample />
      </div>
    </DesignSystemLayout>
  );
}

function DialogAnatomyExample() {
  return (
    <Card
      title="Dialog anatomy"
      description="A non-modal preview of the standard dialog treatment."
    >
      <DialogPanel>
        <DialogHeader
          title="Invite team member"
          message="Send an invitation to collaborate on this workspace."
          titleId="dialog-preview-title"
        />
        <DialogContent>
          <p class="type-body-small text-muted">
            Dialogs keep related context and actions together without leaving the current page.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button disabled variant="ghost">
            Cancel
          </Button>
          <Button disabled>Send invite</Button>
        </DialogFooter>
      </DialogPanel>
    </Card>
  );
}

function LiveModalExample() {
  const examples = dialogExamples.map((example) => (
    <>
      <Button
        hx-get={`/design-system/dialogs/example?size=${example.id}`}
        hx-target={`#dialog-${example.id} > .dialog__panel`}
        hx-swap="innerHTML"
        hx-disabled-elt="this"
      >
        {example.label}
      </Button>
      <Dialog
        id={`dialog-${example.id}`}
        class={example.class}
        aria-labelledby={`dialog-${example.id}-title`}
      />
    </>
  ));

  return (
    <Card
      title="Dialog sizes"
      description="HTMX loads dialog content as a partial, then opens the native modal."
    >
      <div class="flex flex-wrap gap-3">{examples}</div>
      <p class="type-body-small mt-4 text-muted">
        Compare a compact prompt, a medium panel, and a large workspace. On small screens, all three
        fill the viewport.
      </p>
    </Card>
  );
}
