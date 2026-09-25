import type {Child} from 'hono/jsx';

import {AppLayout} from '../../ui/AppLayout.tsx';
import {Document} from '../../ui/Document.tsx';
import {navigation} from '../navigation.ts';

type CinefileAdminLayoutProps = {
  activePath: string;
  children: Child;
  title: string;
};

export function CinefileAdminLayout({activePath, children, title}: CinefileAdminLayoutProps) {
  return (
    <Document title={`${title} · Cinefile Admin`}>
      <AppLayout
        activePath={activePath}
        appName="Cinefile Admin"
        appHref="/cinefile-admin"
        navigation={navigation}
      >
        {children}
      </AppLayout>
    </Document>
  );
}
