import type {Child} from 'hono/jsx';

import {Alert} from '../../ui/Alert.tsx';
import {Button} from '../../ui/Button.tsx';
import {Dialog, DialogContent, DialogFooter, DialogHeader} from '../../ui/Dialog.tsx';
import {Input, Select} from '../../ui/Forms.tsx';
import {Typeahead} from '../../ui/Typeahead.tsx';

const formId = 'collection-updater-draft-form';

export function CollectionUpdaterDraftDialog() {
  return (
    <Dialog
      class="h-[min(52rem,calc(100dvh-3rem))] max-w-3xl"
      aria-labelledby="collection-updater-draft-dialog-title"
      {...{
        'x-ref': 'editorDialog',
        'x-on:close': 'discardEditor()',
      }}
    >
      <template {...{'x-if': 'editingUpdaterId === null'}}>
        <DialogHeader
          title="New Collection Updater"
          message="Choose a target and define ordered movie conditions."
          titleId="collection-updater-draft-dialog-title"
        />
      </template>
      <template {...{'x-if': 'editingUpdaterId !== null'}}>
        <DialogHeader
          title="Edit Collection Updater"
          message="Choose a target and define ordered movie conditions."
          titleId="collection-updater-draft-dialog-title"
        />
      </template>
      <DialogContent>
        <template {...{'x-if': 'editorDraft'}}>
          <form
            id={formId}
            class="space-y-8"
            novalidate
            {...{'x-on:submit.prevent': 'commitEditor()'}}
          >
            <DraftErrors />
            <TargetEditor />
            <ConditionEditor />
          </form>
        </template>
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="ghost">
          Cancel
        </Button>
        <Button type="submit" form={formId} {...{'x-bind:disabled': '!editorDraft'}}>
          Save updater
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function DraftErrors() {
  return (
    <Alert variant="error" {...{'x-show': 'editorErrorMessages().length'}}>
      <div>
        <p class="type-control">The updater could not be applied.</p>
        <ul class="mt-1 list-disc pl-5">
          <template {...{'x-for': 'message in editorErrorMessages()', 'x-bind:key': 'message'}}>
            <li {...{'x-text': 'message'}} />
          </template>
        </ul>
      </div>
    </Alert>
  );
}

function TargetEditor() {
  return (
    <div class="space-y-3">
      <Alert variant="warning" {...{'x-show': '!catalog'}}>
        The cached catalog is unavailable. This updater must retain its existing target.
      </Alert>
      <div class="space-y-2">
        <template {...{'x-if': 'catalog'}}>
          <Typeahead
            name="draft-collection"
            label="Target collection"
            source="/jellyfin/collection-updaters/collections"
            {...{
              'x-bind:data-selected': 'typeaheadSelection(editorDraft.collection)',
              'x-on:typeahead-change': 'selectDraftCollection($event.detail.items)',
              'x-bind:aria-invalid': "editorErrorFor('collectionId') ? 'true' : undefined",
              'x-bind:aria-describedby':
                "editorErrorFor('collectionId') ? 'draft-collection-id-error' : undefined",
            }}
          />
        </template>
        <template {...{'x-if': '!catalog'}}>
          <Input
            id="draft-collection-id"
            readonly
            {...{'x-bind:value': 'editorDraft.collection.title'}}
          />
        </template>
        <p
          id="draft-collection-id-error"
          class="type-caption text-danger"
          role="alert"
          {...{
            'x-show': "editorErrorFor('collectionId')",
            'x-text': "editorErrorFor('collectionId')",
          }}
        />
      </div>
    </div>
  );
}

function ConditionEditor() {
  return (
    <section aria-labelledby="draft-conditions-heading" class="space-y-4">
      <div>
        <h2 id="draft-conditions-heading" class="type-heading-2">
          Conditions
        </h2>
        <p class="type-body-small mt-1 text-muted">
          Movies must match every condition in this order.
        </p>
      </div>
      <p
        class="type-caption text-danger"
        role="alert"
        {...{
          'x-show': "editorErrorFor('conditions')",
          'x-text': "editorErrorFor('conditions')",
        }}
      />
      <template
        {...{
          'x-for': '(condition, conditionIndex) in editorDraft.conditions',
          'x-bind:key': 'condition.key',
        }}
      >
        <fieldset
          class="rounded-card border border-border bg-surface p-5"
          {...{'x-bind:aria-label': '`Condition ${conditionIndex + 1}`'}}
        >
          <legend
            class="type-control px-2"
            aria-hidden="true"
            {...{'x-text': "conditionIndex === 0 ? 'WHERE' : 'AND'"}}
          />
          <div class="grid gap-5 sm:grid-cols-2">
            <DraftSelect label="Field" property="field" change="changeField(condition)">
              <option value="movie.year">Release year</option>
              <option value="movie.genres">Genre</option>
            </DraftSelect>
            <template {...{'x-if': "condition.field === 'movie.year'"}}>
              <div>
                <DraftSelect
                  label="Operator"
                  property="operator"
                  change="changeOperator(condition)"
                >
                  <option value="eq">is</option>
                  <option value="lt">is before</option>
                  <option value="gt">is after</option>
                  <option value="lte">is at most</option>
                  <option value="gte">is at least</option>
                  <option value="between">is between</option>
                </DraftSelect>
              </div>
            </template>
            <template {...{'x-if': "condition.field === 'movie.genres'"}}>
              <div>
                <DraftSelect
                  label="Operator"
                  property="operator"
                  change="changeOperator(condition)"
                >
                  <option value="includes_any">includes any</option>
                  <option value="includes_all">includes all</option>
                </DraftSelect>
              </div>
            </template>
            <div
              class="sm:col-span-2"
              {...{
                'x-show': "condition.field === 'movie.year' && condition.operator !== 'between'",
              }}
            >
              <DraftInput label="Release year" property="value" type="number" />
            </div>
            <div
              class="grid gap-5 sm:col-span-2 sm:grid-cols-2"
              {...{
                'x-show': "condition.field === 'movie.year' && condition.operator === 'between'",
              }}
            >
              <DraftInput label="Start year" property="start" type="number" />
              <DraftInput label="End year" property="end" type="number" />
            </div>
            <div class="sm:col-span-2" {...{'x-show': "condition.field === 'movie.genres'"}}>
              <DraftInput label="Genres (comma separated)" property="values" type="text" />
            </div>
          </div>
          <div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              size="sm"
              variant="ghost"
              {...{
                'x-on:click': 'moveCondition(condition.key, -1)',
                'x-bind:disabled': 'conditionIndex === 0',
              }}
            >
              Move up
            </Button>
            <Button
              size="sm"
              variant="ghost"
              {...{
                'x-on:click': 'moveCondition(condition.key, 1)',
                'x-bind:disabled': 'conditionIndex === editorDraft.conditions.length - 1',
              }}
            >
              Move down
            </Button>
            <Button size="sm" variant="ghost" {...{'x-on:click': 'removeCondition(condition.key)'}}>
              Remove
            </Button>
          </div>
        </fieldset>
      </template>
      <Button variant="secondary" {...{'x-on:click': 'addCondition()'}}>
        Add condition
      </Button>
    </section>
  );
}

type DraftSelectProps = {
  children: Child;
  change: string;
  label: string;
  property: 'field' | 'operator';
};

function DraftSelect({children, change, label, property}: DraftSelectProps) {
  return (
    <div class="space-y-2">
      <label
        class="type-control block text-foreground"
        {...{'x-bind:for': '`draft-condition-${condition.key}-' + property + '`'}}
      >
        {label}
      </label>
      <Select
        {...{
          'x-bind:id': '`draft-condition-${condition.key}-' + property + '`',
          'x-model': `condition.${property}`,
          'x-on:change': change,
          'x-bind:aria-invalid': `editorConditionError(condition.key, '${property}') ? 'true' : undefined`,
        }}
      >
        {children}
      </Select>
      <DraftFieldError property={property} />
    </div>
  );
}

type DraftInputProps = {
  label: string;
  property: 'value' | 'start' | 'end' | 'values';
  type: 'number' | 'text';
};

function DraftInput({label, property, type}: DraftInputProps) {
  return (
    <div class="space-y-2">
      <label
        class="type-control block text-foreground"
        {...{'x-bind:for': '`draft-condition-${condition.key}-' + property + '`'}}
      >
        {label}
      </label>
      <Input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        {...{
          'x-bind:id': '`draft-condition-${condition.key}-' + property + '`',
          'x-model': `condition.${property}`,
          'x-bind:aria-invalid': `editorConditionError(condition.key, '${property}') ? 'true' : undefined`,
        }}
      />
      <DraftFieldError property={property} />
    </div>
  );
}

type DraftFieldErrorProps = {
  property: 'field' | 'operator' | 'value' | 'start' | 'end' | 'values';
};

function DraftFieldError({property}: DraftFieldErrorProps) {
  return (
    <p
      class="type-caption text-danger"
      role="alert"
      {...{
        'x-show': `editorConditionError(condition.key, '${property}')`,
        'x-text': `editorConditionError(condition.key, '${property}')`,
      }}
    />
  );
}
