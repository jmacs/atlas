import type {Child} from 'hono/jsx';

import {Document} from '../../ui/Document.tsx';
import {AppLayout} from '../../ui/AppLayout.tsx';
import {navigation} from '../navigation.ts';

type DashboardLayoutProps = {
  children: Child;
  scripts?: string[];
  title: string;
};

export function DashboardLayout({children, scripts, title}: DashboardLayoutProps) {
  return (
    <Document title={`${title} · Dashboard`} scripts={scripts}>
      <AppLayout activePath="/" appName="Dashboard" appHref="/" navigation={navigation}>
        {children}
      </AppLayout>
    </Document>
  );
}
