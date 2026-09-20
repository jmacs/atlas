import type {Child} from 'hono/jsx';

import {AppLayout} from '../../ui/AppLayout.tsx';
import {Document} from '../../ui/Document.tsx';
import {navigation} from '../navigation.ts';

type AtlasLayoutProps = {
  activePath: string;
  children: Child;
  title: string;
};

export function AtlasLayout({activePath, children, title}: AtlasLayoutProps) {
  return (
    <Document title={`${title} · Atlas`}>
      <AppLayout activePath={activePath} appName="Atlas" appHref="/atlas" navigation={navigation}>
        {children}
      </AppLayout>
    </Document>
  );
}
