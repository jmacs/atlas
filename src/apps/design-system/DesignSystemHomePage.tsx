import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {DesignSystemLayout} from './DesignSystemLayout.tsx';
import {getNavigationChildren} from '../navigation.ts';

export function DesignSystemHomePage() {
  return (
    <DesignSystemLayout activePath="/design-system" title="Overview">
      <PageHeader
        title="Design system"
        description="Explore the foundations and components that make Atlas feel consistent."
      />
      <AppNavGrid
        navigation={getNavigationChildren('/design-system')}
        label="Explore the design system"
      />
    </DesignSystemLayout>
  );
}
