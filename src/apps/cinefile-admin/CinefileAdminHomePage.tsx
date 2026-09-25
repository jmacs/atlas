import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {getNavigationChildren} from '../navigation.ts';
import {CinefileAdminLayout} from './CinefileAdminLayout.tsx';

export function CinefileAdminHomePage() {
  return (
    <CinefileAdminLayout activePath="/cinefile-admin" title="Overview">
      <PageHeader
        title="Cinefile Admin"
        description="Review and manage movie requests from Cinefile."
      />
      <AppNavGrid
        navigation={getNavigationChildren('/cinefile-admin')}
        label="Explore Cinefile administration"
      />
    </CinefileAdminLayout>
  );
}
