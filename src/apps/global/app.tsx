import {Hono} from 'hono';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {navigation} from '../navigation.ts';
import {Icon} from '../../ui/Icon.tsx';
import type {TypeaheadResponse} from '../../ui/Typeahead.tsx';

const entries = navigation
  .filter((item) => !item.hidden)
  .flatMap((parent) => [
    parent,
    ...(parent.children ?? [])
      .filter((child) => !child.hidden)
      .map((child) => ({
        ...child,
        label: `${parent.label} / ${child.label}`,
      })),
  ]);
const navigationItems = entries.map((item, index) => ({
  value: item.href,
  name: item.label,
  description: item.description,
  href: item.href,
  icon: item.icon ? `/global/navigation/icons/${index}` : undefined,
}));
const searchableItems = navigationItems.map((item) => ({
  item,
  text: `${item.name} ${item.description ?? ''}`.toLowerCase(),
}));

const app = new Hono<AtlasEnv>();
app.get('/navigation', (c) => {
  const search = (c.req.query('q') ?? '').trim();
  const query = search.toLowerCase();
  const items = searchableItems.filter(({text}) => text.includes(query)).map(({item}) => item);
  return c.json({search, kind: 'global.navigation', items} satisfies TypeaheadResponse);
});
app.get('/navigation/icons/:index', (c) => {
  const icon = entries[Number(c.req.param('index'))]?.icon;
  if (!icon) {
    return c.notFound();
  }
  c.header('Content-Type', 'image/svg+xml');
  return c.body((<Icon icon={icon} xmlns="http://www.w3.org/2000/svg" />).toString());
});

export const globalApp: AtlasApp = {id: 'global', mountPath: '/global', app};
