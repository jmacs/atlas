import type {Child} from 'hono/jsx';

import {AppLayout} from '../../ui/AppLayout.tsx';
import {Document} from '../../ui/Document.tsx';
import {navigation} from '../navigation.ts';

type ActionsLayoutProps = {
  children: Child;
  scripts?: string[];
  title: string;
};

export function ActionsLayout(props: ActionsLayoutProps) {
  const {children, scripts, title} = props;

  return (
    <Document title={`${title} · Atlas`} scripts={scripts}>
      <AppLayout activePath="/actions" appName="Actions" appHref="/actions" navigation={navigation}>
        <div class="actions-app mx-auto max-w-5xl">{children}</div>
      </AppLayout>
    </Document>
  );
}
