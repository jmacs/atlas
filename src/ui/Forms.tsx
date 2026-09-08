import type {Child, JSX} from 'hono/jsx';
import {createContext, useContext} from 'hono/jsx';
import clsx from 'clsx';

type FieldContextValue = {
  error: boolean;
  id: string;
  messageId?: string;
};

const FieldContext = createContext<FieldContextValue | undefined>(undefined);

export type FieldProps = {
  children: Child;
  class?: string;
  error?: boolean;
  id: string;
  label: string;
  validationMessage?: string;
};

export function Field({
  children,
  class: className,
  error = false,
  id,
  label,
  validationMessage,
}: FieldProps) {
  const messageId = validationMessage ? `${id}-validation` : undefined;

  return (
    <FieldContext.Provider value={{error, id, messageId}}>
      <div class={clsx('space-y-2', className)}>
        <label class="type-control block text-foreground" for={id}>
          {label}
        </label>
        {children}
        {validationMessage ? (
          <p
            id={messageId}
            class={clsx('type-caption', error ? 'text-danger' : 'text-muted')}
            role={error ? 'alert' : undefined}
          >
            {validationMessage}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export type InputProps = Omit<JSX.IntrinsicElements['input'], 'class'> & {
  class?: string;
};

/**
 * Input, Select, and TextArea are standalone styled controls. Prefer their Field
 * variants in conventional forms; those compose the control with its label and validation state.
 */
export function Input({class: className, ...props}: InputProps) {
  const field = useContext(FieldContext);
  const error = props['aria-invalid'] === 'true' || props['aria-invalid'] === true || field?.error;

  return (
    <input
      {...props}
      id={props.id ?? field?.id}
      class={clsx(
        'type-body-small h-10 w-full rounded-md border bg-background px-3 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-danger' : 'border-border-strong',
        className,
      )}
      aria-describedby={props['aria-describedby'] ?? field?.messageId}
      aria-invalid={props['aria-invalid'] ?? (field?.error ? 'true' : undefined)}
    />
  );
}

export type SelectProps = Omit<JSX.IntrinsicElements['select'], 'children' | 'class'> & {
  children: Child;
  class?: string;
};

export function Select({children, class: className, ...props}: SelectProps) {
  const field = useContext(FieldContext);
  const error = props['aria-invalid'] === 'true' || props['aria-invalid'] === true || field?.error;

  return (
    <select
      {...props}
      id={props.id ?? field?.id}
      class={clsx(
        'type-body-small h-10 w-full rounded-md border bg-background px-3 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-danger' : 'border-border-strong',
        className,
      )}
      aria-describedby={props['aria-describedby'] ?? field?.messageId}
      aria-invalid={props['aria-invalid'] ?? (field?.error ? 'true' : undefined)}
    >
      {children}
    </select>
  );
}

export type TextAreaProps = Omit<JSX.IntrinsicElements['textarea'], 'class'> & {
  class?: string;
};

export function TextArea({class: className, ...props}: TextAreaProps) {
  const field = useContext(FieldContext);
  const error = props['aria-invalid'] === 'true' || props['aria-invalid'] === true || field?.error;

  return (
    <textarea
      {...props}
      id={props.id ?? field?.id}
      class={clsx(
        'type-body-small min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-danger' : 'border-border-strong',
        className,
      )}
      aria-describedby={props['aria-describedby'] ?? field?.messageId}
      aria-invalid={props['aria-invalid'] ?? (field?.error ? 'true' : undefined)}
    />
  );
}

export type InputFieldProps = Omit<InputProps, 'id'> &
  Omit<FieldProps, 'children' | 'class'> & {
    fieldClass?: string;
  };

export function InputField({
  error,
  fieldClass,
  id,
  label,
  validationMessage,
  ...props
}: InputFieldProps) {
  return (
    <Field
      class={fieldClass}
      error={error}
      id={id}
      label={label}
      validationMessage={validationMessage}
    >
      <Input {...props} />
    </Field>
  );
}

export type SelectFieldProps = Omit<SelectProps, 'id'> &
  Omit<FieldProps, 'children' | 'class'> & {
    fieldClass?: string;
  };

export function SelectField({
  children,
  error,
  fieldClass,
  id,
  label,
  validationMessage,
  ...props
}: SelectFieldProps) {
  return (
    <Field
      class={fieldClass}
      error={error}
      id={id}
      label={label}
      validationMessage={validationMessage}
    >
      <Select {...props}>{children}</Select>
    </Field>
  );
}

export type TextAreaFieldProps = Omit<TextAreaProps, 'id'> &
  Omit<FieldProps, 'children' | 'class'> & {
    fieldClass?: string;
  };

export function TextAreaField({
  error,
  fieldClass,
  id,
  label,
  validationMessage,
  ...props
}: TextAreaFieldProps) {
  return (
    <Field
      class={fieldClass}
      error={error}
      id={id}
      label={label}
      validationMessage={validationMessage}
    >
      <TextArea {...props} />
    </Field>
  );
}

export type ToggleProps = Omit<JSX.IntrinsicElements['input'], 'class' | 'id' | 'type'> & {
  class?: string;
  /** Help text shown below the label. */
  description?: string;
  id: string;
  label: string;
};

/**
 * A binary, form-backed control. Like a native checkbox, it submits its value
 * only when on.
 */
export function Toggle({class: className, description, id, label, ...props}: ToggleProps) {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div class="space-y-2">
      <label class="flex cursor-pointer items-center gap-3 text-foreground" for={id}>
        <input
          id={id}
          type="checkbox"
          class="peer sr-only"
          aria-describedby={descriptionId}
          {...props}
        />
        <span
          aria-hidden="true"
          class={clsx(
            'flex h-6 w-11 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition peer-checked:bg-accent peer-checked:[&>span]:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className,
          )}
        >
          <span class="h-5 w-5 rounded-full bg-background shadow-sm transition-transform" />
        </span>
        <span class="type-control">{label}</span>
      </label>
      {description ? (
        <p id={descriptionId} class="type-caption text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
