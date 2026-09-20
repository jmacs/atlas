import {ArrowRight, Film} from '@lucide/icons';

import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';

export function CinefileHomePage() {
  return (
    <CinefileLayout title="Movies">
      <PageHeader
        title="Your next movie night starts here"
        description="Search for movies, see whether they are already in your collection, and save missing titles for later."
      />
      <a
        class="group flex max-w-xl items-center gap-5 rounded-card border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        href="/cinefile/search"
      >
        <span
          class="grid size-12 place-items-center rounded-lg bg-accent/10 text-accent"
          aria-hidden="true"
        >
          <Icon icon={Film} size={24} />
        </span>
        <span class="min-w-0 flex-1">
          <span class="type-heading-3 block text-foreground">Search movies</span>
          <span class="type-body-small mt-1 block text-muted">
            Find a title and check its place in your collection.
          </span>
        </span>
        <Icon
          icon={ArrowRight}
          size={20}
          class="text-muted group-hover:text-accent"
          aria-hidden="true"
        />
      </a>
    </CinefileLayout>
  );
}
