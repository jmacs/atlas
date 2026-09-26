import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {getNavigationChildren} from '../navigation.ts';
import {CinefileAdminLayout} from './CinefileAdminLayout.tsx';
import {Button} from '../../ui/Button.tsx';
import {Alert} from '../../ui/Alert.tsx';

type CinefileAdminHomePageProps = {
  migrationMessage?: string;
  migrationStatus?: 'error' | 'success';
};

export function CinefileAdminHomePage({
  migrationMessage,
  migrationStatus,
}: CinefileAdminHomePageProps) {
  return (
    <CinefileAdminLayout activePath="/cinefile-admin" title="Overview">
      <PageHeader
        title="Cinefile Admin"
        description="Review and manage media requests from Cinefile."
      />
      {migrationMessage === undefined ? null : (
        <Alert class="mb-6" variant={migrationStatus === 'error' ? 'error' : 'success'}>
          {migrationMessage}
        </Alert>
      )}
      <AppNavGrid
        navigation={getNavigationChildren('/cinefile-admin')}
        label="Explore Cinefile administration"
      />
      <section class="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm">
        <h2 class="type-heading-2 text-foreground">Request schema</h2>
        <p class="type-body mt-2 text-muted">
          Upgrade a legacy requests file before managing movie and TV series requests.
        </p>
        <form action="/cinefile-admin/migrate" method="post" class="mt-5">
          <Button type="submit">Upgrade request schema</Button>
        </form>
      </section>
    </CinefileAdminLayout>
  );
}
