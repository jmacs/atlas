import {ArrowRight, Film, List, Search} from '@lucide/icons';

import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';

export function CinefileHomePage() {
  return (
    <CinefileLayout title="Movies">
      <PageHeader
        title="Find a movie"
        description="Search for movies, see whether they are already in your collection, and save missing titles for later."
      />
      <div class="grid max-w-xl gap-4">
        <CinefileHomeTile
          description="Search for movies in the Movie Database."
          href="/cinefile/tmdb-search"
          icon={Search}
          title="Search TMDB"
        />
        <CinefileHomeTile
          description="Find a movie in your collection."
          href="/cinefile/search"
          icon={Film}
          title="Search catalog"
        />
        <CinefileHomeTile
          description="See the movies you have asked to add."
          href="/cinefile/requests"
          icon={List}
          title="View requests"
        />
      </div>
    </CinefileLayout>
  );
}

type CinefileHomeTileProps = {
  description: string;
  href: string;
  icon: typeof Film;
  title: string;
};

function CinefileHomeTile({description, href, icon, title}: CinefileHomeTileProps) {
  return (
    <a
      class="group flex items-center gap-5 rounded-card border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      href={href}
    >
      <span
        class="grid size-12 place-items-center rounded-lg bg-accent/10 text-accent"
        aria-hidden="true"
      >
        <Icon icon={icon} size={24} />
      </span>
      <span class="min-w-0 flex-1">
        <span class="type-heading-3 block text-foreground">{title}</span>
        <span class="type-body-small mt-1 block text-muted">{description}</span>
      </span>
      <Icon
        icon={ArrowRight}
        size={20}
        class="text-muted group-hover:text-accent"
        aria-hidden="true"
      />
    </a>
  );
}
