import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {DashboardLayout} from './DashboardLayout.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {navigation} from '../navigation.ts';

export function DashboardPage() {
  return (
    <DashboardLayout title="Apps">
      <PageHeader title="Dashboard" description="Access the apps and tools available in Atlas." />
      <AppNavGrid navigation={navigation} label="Explore Atlas apps" />
    </DashboardLayout>
  );
}
