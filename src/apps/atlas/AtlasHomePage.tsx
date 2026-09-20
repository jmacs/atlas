import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {getNavigationChildren} from '../navigation.ts';
import {AtlasLayout} from './AtlasLayout.tsx';

export function AtlasHomePage() {
  return (
    <AtlasLayout activePath="/atlas" title="Overview">
      <PageHeader title="Atlas" description="Explore Atlas tools and diagnostic information." />
      <AppNavGrid navigation={getNavigationChildren('/atlas')} label="Explore Atlas tools" />
    </AtlasLayout>
  );
}
