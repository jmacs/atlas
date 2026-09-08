import type {Child} from 'hono/jsx';

import {AppLayout} from '../../ui/AppLayout.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {designSystemNavigation} from './navigation.ts';

type DesignSystemLayoutProps = {
  activePath: string;
  children: Child;
  description: string;
  title: string;
};

export function DesignSystemLayout({
  activePath,
  children,
  description,
  title,
}: DesignSystemLayoutProps) {
  return (
    <AppLayout
      activePath={activePath}
      appName="Design system"
      navigation={designSystemNavigation}
      title={title}
    >
      <PageHeader title={title} description={description} />
      {children}
    </AppLayout>
  );
}
