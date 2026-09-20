import {ArrowRight, Search} from '@lucide/icons';

import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';
import {CinefileMovieTiles, type CinefileMovie} from './CinefileMovie.tsx';
import {CinefileSearchForm} from './CinefileSearchForm.tsx';

type CinefileSearchPageProps = {
  query?: string;
  resultCount?: number;
  results?: CinefileMovie[];
  status: 'empty' | 'form' | 'results' | 'unavailable';
};

export function CinefileSearchPage({
  query,
  resultCount = 0,
  results = [],
  status,
}: CinefileSearchPageProps) {
  const isResultsPage = status !== 'form';
  const pageTitle = isResultsPage ? 'Catelog search results' : 'Search catalog';
  const pageDescription = isResultsPage ? undefined : 'Find a title in your collection.';
  return (
    <CinefileLayout title={pageTitle} scripts={['/scripts/apps/cinefile/search-form.js']}>
      <PageHeader title={pageTitle} description={pageDescription} />
      <CinefileSearchForm action="/cinefile/search/results" query={query} />
      <SearchContent
        query={query ?? ''}
        resultCount={resultCount}
        results={results}
        status={status}
      />
    </CinefileLayout>
  );
}

type SearchContentProps = {
  query: string;
  resultCount: number;
  results: CinefileMovie[];
  status: CinefileSearchPageProps['status'];
};

function SearchContent({query, resultCount, results, status}: SearchContentProps) {
  if (status === 'form') {
    return null;
  }
  if (status === 'unavailable') {
    return <p class="type-body mt-6 text-danger">Your catalog is unavailable. Try again later.</p>;
  }
  if (status === 'empty') {
    return (
      <section class="mt-6">
        <p class="type-body text-foreground">“{query}” is not in your catalog.</p>
        <a
          class="group mt-5 flex w-full items-center gap-4 rounded-card border border-border bg-surface p-5 text-left shadow-sm transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          href={`/cinefile/tmdb-search/results?q=${encodeURIComponent(query)}`}
        >
          <span
            class="grid size-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <Icon icon={Search} size={21} />
          </span>
          <span class="min-w-0 flex-1">
            <span class="type-heading-3 block text-foreground">Search for movie on TMDB</span>
          </span>
          <Icon
            icon={ArrowRight}
            size={20}
            class="text-muted transition-colors group-hover:text-accent"
          />
        </a>
      </section>
    );
  }
  const hiddenResultCount = Math.max(0, resultCount - results.length);
  return (
    <section class="mt-6">
      <p class="type-body mb-4 text-muted">
        {resultCount} {resultCount === 1 ? 'match' : 'matches'} for “{query}”
      </p>
      <CinefileMovieTiles movies={results} />
      {hiddenResultCount === 0 ? null : (
        <p class="type-heading-3 mt-4 grid min-h-20 place-items-center rounded-card border border-border bg-surface-raised text-muted shadow-sm">
          + {hiddenResultCount} more
        </p>
      )}
    </section>
  );
}
