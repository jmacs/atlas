import {Hono} from 'hono';

import type {AtlasApp} from '../../core/host.tsx';
import {ColorsPage} from './ColorsPage.tsx';
import {ComponentsPage, ServerTable} from './ComponentsPage.tsx';
import {DialogExampleContent} from './DialogExampleContent.tsx';
import {DialogsPage} from './DialogsPage.tsx';
import {TypographyPage} from './TypographyPage.tsx';
import {dialogExamples} from './dialogExamples.ts';
import {Toast, type ToastVariant} from '../../ui/Toast.tsx';

const app = new Hono();

app.get('/', (c) => c.html(<ComponentsPage />));

app.get('/table', (c) => {
  const sort = c.req.query('sort');
  const sortableColumns = ['server', 'region', 'storage'];

  if (!sort) {
    return c.text('Unknown table sort', 400);
  }

  const sortColumn = sort.startsWith('-') ? sort.slice(1) : sort;
  if (!sortableColumns.includes(sortColumn)) {
    return c.text('Unknown table sort', 400);
  }

  return c.html(<ServerTable sort={sort} />);
});

const toastMessages: Record<ToastVariant, string> = {
  success: 'Your settings were saved successfully.',
  info: 'A new Atlas version is available.',
  warning: 'Storage is nearing its configured capacity.',
  error: 'Atlas could not connect to the server.',
};

app.get('/toasts/example', (c) => {
  const variant = c.req.query('variant') as ToastVariant;
  const message = toastMessages[variant];
  if (!message) {
    return c.text('Unknown toast variant', 400);
  }

  return c.html(
    <Toast oob variant={variant} timeout={5000}>
      {message}
    </Toast>,
  );
});

app.get('/typography', (c) => c.html(<TypographyPage />));

app.get('/colors', (c) => c.html(<ColorsPage />));

app.get('/dialogs', (c) => c.html(<DialogsPage />));

app.get('/dialogs/example', (c) => {
  const size = c.req.query('size') ?? 'medium';
  const example = dialogExamples.find((example) => example.id === size);
  if (!example) {
    return c.text('Unknown dialog size', 400);
  }
  return c.html(<DialogExampleContent idPrefix={`dialog-${example.id}`} />);
});

export const designSystemApp: AtlasApp = {
  id: 'design-system',
  mountPath: '/design-system',
  app,
};
