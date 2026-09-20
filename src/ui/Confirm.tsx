import type {Child, JSX} from 'hono/jsx';

import {Button, type ButtonVariant} from './Button.tsx';
import {DialogContent, DialogFooter, DialogHeader} from './Dialog.tsx';

type ConfirmProps = {
  confirmButtonProps: Omit<JSX.IntrinsicElements['button'], 'children' | 'class' | 'type'>;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  message: Child;
  showClose?: boolean;
  title: string;
  cancelLabel?: string;
};

export function Confirm({
  cancelLabel = 'Cancel',
  confirmButtonProps,
  confirmLabel,
  confirmVariant = 'primary',
  message,
  showClose = true,
  title,
}: ConfirmProps) {
  return (
    <>
      <DialogHeader title={title} showClose={showClose} />
      <DialogContent>
        <p class="type-body text-muted">{message}</p>
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="secondary">
          {cancelLabel}
        </Button>
        <Button {...confirmButtonProps} variant={confirmVariant} isLoading="htmx">
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
