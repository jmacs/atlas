import {Search} from '@lucide/icons';

import {buttonClassNames} from '../../ui/Button.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';
import {CinefileMovieTiles, type CinefileMovie} from './CinefileMovie.tsx';

type CinefileRequestsPageProps = {
  movies: CinefileMovie[];
  status: 'empty' | 'error' | 'results';
};

export function CinefileRequestsPage({movies, status}: CinefileRequestsPageProps) {
  return (
    <CinefileLayout title="Your requests">
      <PageHeader
        title="Your requests"
        description="Movies you have asked to add to your collection."
      />
      <RequestsContent movies={movies} status={status} />
    </CinefileLayout>
  );
}

type RequestsContentProps = CinefileRequestsPageProps;

function RequestsContent({movies, status}: RequestsContentProps) {
  if (status === 'error') {
    return (
      <p class="type-body mt-6 text-danger">Your requests are unavailable. Please try again.</p>
    );
  }
  if (status === 'empty') {
    return (
      <section class="mt-6 grid min-h-56 place-items-center rounded-card border border-border bg-surface px-6 py-10 text-center shadow-sm">
        <div>
          <h2 class="type-heading-2 text-foreground">Your request queue is empty</h2>
          <p class="type-body mt-2 text-muted">Search TMDB to find a movie to add.</p>
          <a class={buttonClassNames('primary', 'md', 'mt-6')} href="/cinefile/tmdb-search">
            <Icon icon={Search} size={18} aria-hidden="true" />
            Search TMDB
          </a>
        </div>
      </section>
    );
  }
  return (
    <section class="mt-6">
      <CinefileMovieTiles movies={movies} />
    </section>
  );
}
