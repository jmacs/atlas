import {Button} from '../../ui/Button.tsx';
import {DialogContent, DialogFooter, DialogHeader} from '../../ui/Dialog.tsx';
import {InputField} from '../../ui/Forms.tsx';

type DialogExampleContentProps = {
  idPrefix: string;
};

export function DialogExampleContent({idPrefix}: DialogExampleContentProps) {
  return (
    <>
      <DialogHeader
        title="Invite team member"
        message="Send an invitation to collaborate on this workspace."
        titleId={`${idPrefix}-title`}
      />
      <DialogContent>
        <InputField
          id={`${idPrefix}-email`}
          label="Email address"
          placeholder="teammate@example.com"
          type="email"
        />
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="ghost">
          Cancel
        </Button>
        <Button>Send invite</Button>
      </DialogFooter>
    </>
  );
}
