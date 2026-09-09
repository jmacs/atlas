import {renderToReadableStream} from 'hono/jsx/streaming';
import {expect, test} from 'vitest';

import {InputField, TextAreaField} from './Forms.tsx';

async function renderFields() {
  const stream = renderToReadableStream(
    <>
      <InputField
        id="server-name"
        name="name"
        label="Server name"
        validationMessage="Shown to other users."
      />
      <InputField
        id="server-url"
        name="url"
        label="Server URL"
        error
        validationMessage="Enter a valid URL."
      />
      <TextAreaField
        id="server-notes"
        name="notes"
        label="Notes"
        validationMessage="Optional context."
      />
    </>,
  );
  return new Response(stream).text();
}

test('associates field labels, descriptions, and validation state with controls', async () => {
  const fields = await renderFields();

  expect(fields).toContain('<label class="type-control block text-foreground" for="server-name">');
  expect(fields).toContain('id="server-name"');
  expect(fields).toContain('aria-describedby="server-name-validation"');
  expect(fields).toContain('id="server-url"');
  expect(fields).toContain('aria-describedby="server-url-validation" aria-invalid="true"');
  expect(fields).toContain(
    'id="server-url-validation" class="type-caption text-danger" role="alert"',
  );
  expect(fields).toContain('id="server-notes"');
  expect(fields).toContain('aria-describedby="server-notes-validation"');
});
