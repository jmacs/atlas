import type {Child} from 'hono/jsx';

import {AppLayout} from '../../ui/AppLayout.tsx';
import {Document} from '../../ui/Document.tsx';
import {navigation} from '../navigation.ts';

type DesignSystemLayoutProps = {
  activePath: string;
  children: Child;
  scripts?: string[];
  title: string;
};

export function DesignSystemLayout({
  activePath,
  children,
  scripts,
  title,
}: DesignSystemLayoutProps) {
  return (
    <Document title={`${title} · Design system`} scripts={scripts}>
      <AppLayout
        activePath={activePath}
        appName="Design system"
        appHref="/design-system"
        navigation={navigation}
      >
        {children}
      </AppLayout>
    </Document>
  );
}
