import type {Child} from 'hono/jsx';

import {Document} from '../../ui/Document.tsx';
import {AppLayout} from '../../ui/AppLayout.tsx';
import {navigation} from '../navigation.ts';

type JellyfinLayoutProps = {
  activePath: string;
  title: string;
  children: Child;
  notifications?: Child;
  scripts?: string[];
};

export function JellyfinLayout({
  title,
  activePath,
  children,
  notifications,
  scripts,
}: JellyfinLayoutProps) {
  return (
    <Document title={`${title} · Jellyfin`} scripts={scripts}>
      <AppLayout
        activePath={activePath}
        appName="Jellyfin"
        appHref="/jellyfin"
        navigation={navigation}
        notifications={notifications}
      >
        {children}
      </AppLayout>
    </Document>
  );
}
