import {Hono} from 'hono';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {DesignSystemHomePage} from './DesignSystemHomePage.tsx';
import {ColorsPage} from './ColorsPage.tsx';
import {ComponentsPage, ServerTable} from './ComponentsPage.tsx';
import {DialogExampleContent} from './DialogExampleContent.tsx';
import {TypographyPage} from './TypographyPage.tsx';
import {dialogExamples} from './dialogExamples.ts';
import {Toast, type ToastVariant} from '../../ui/Toast.tsx';

import {Typeahead, type TypeaheadResponse} from '../../ui/Typeahead.tsx';
import {DialogHeader, DialogContent, DialogFooter} from '../../ui/Dialog.tsx';
import {Button} from '../../ui/Button.tsx';
import {typeaheadCities} from './typeahead-cities.ts';

const app = new Hono<AtlasEnv>();

app.get('/components/typeahead/cities', (c) => {
  const search = (c.req.query('q') ?? '').trim();
  const items = search
    ? typeaheadCities
        .filter((city) => city.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 20)
    : [];
  return c.json({search, kind: 'design-system.city', items} satisfies TypeaheadResponse);
});

app.post('/components/typeahead', async (c) => {
  const values = (await c.req.formData()).getAll('cities');
  const cities = values.map((value) => typeaheadCities.find((city) => city.value === value));
  if (
    values.length > typeaheadCities.length ||
    new Set(values).size !== values.length ||
    cities.some((city) => !city)
  ) {
    return c.html(
      <Toast oob variant="error">
        Select valid, unique city IDs.
      </Toast>,
      422,
    );
  }
  const message = cities.length
    ? `Selected cities: ${cities.map((city) => city!.name).join('; ')}.`
    : 'No cities selected.';
  return c.html(
    <Toast oob variant="success">
      {message}
    </Toast>,
  );
});

app.get('/components/typeahead/dialog', (c) =>
  c.html(
    <>
      <DialogHeader title="City preferences" />
      <DialogContent>
        <form aria-label="Dialog city selection">
          <Typeahead
            name="destination"
            label="Destination"
            source="/design-system/components/typeahead/cities"
          />
        </form>
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="secondary">
          Done
        </Button>
      </DialogFooter>
    </>,
  ),
);

app.get('/', (c) => c.html(<DesignSystemHomePage />));

app.get('/components', (c) => c.html(<ComponentsPage />));

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

app.get('/components/dialogs/example', (c) => {
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
