import {JellyfinLayout} from './JellyfinLayout.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {AppNavGrid} from '../../ui/AppNavGrid.tsx';
import {CatalogCard, CatalogContent, type CatalogStatusView} from './CatalogStatus.tsx';
import {getNavigationChildren} from '../navigation.ts';

export type JellyfinHomePageProps = {
  catalog: CatalogStatusView;
};

export function JellyfinHomePage({catalog}: JellyfinHomePageProps) {
  return (
    <JellyfinLayout activePath="/jellyfin" title="Jellyfin">
      <PageHeader
        title="Jellyfin"
        description="Manage and explore the media available on your Jellyfin server."
      />
      <div class="space-y-8">
        <CatalogCard>
          <CatalogContent catalog={catalog} />
        </CatalogCard>
        <AppNavGrid
          navigation={getNavigationChildren('/jellyfin')}
          label="Explore Jellyfin tools"
        />
      </div>
    </JellyfinLayout>
  );
}
